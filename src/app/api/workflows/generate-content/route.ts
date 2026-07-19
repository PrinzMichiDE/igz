import { serve } from "@upstash/workflow/nextjs";
import {
  failJob,
  persistProductExperienceComments,
  persistProductReview,
  prepareProductExperienceComments,
  prepareProductReview,
} from "@/lib/ai/generate";
import {
  persistProductTechProfile,
  prepareProductTechProfile,
} from "@/lib/ai/generate-tech-profile";
import {
  OPENROUTER_CHAT_URL,
  buildOpenRouterJsonBody,
  getOpenRouterAuthHeaders,
  getOpenRouterFallbackModel,
  OPENROUTER_FREE_REVIEW_MODELS,
  parseOpenRouterJsonContent,
  type OpenRouterChatCompletionResponse,
} from "@/lib/ai/openrouter-request";
import {
  countCategoriesWithReviewBacklog,
  countProductsMissingReviews,
  listProductsMissingReviews,
  listProductsNeedingDetailedReviewRefresh,
} from "@/lib/content-backfill";
import { prisma } from "@/lib/db/prisma";
import type { ProductTechProfileAiResponse } from "@/lib/product-tech/types";
import {
  DAILY_NEW_REVIEW_TARGET,
  remainingDailyReviewSlots,
} from "@/lib/review-daily-quota";
import { getWorkflowBaseUrl, triggerWorkflow } from "@/lib/upstash/qstash";
import { acquireLock, releaseLock } from "@/lib/upstash/redis";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Keep short — OpenRouter waits happen in context.call (outside Vercel). */
export const maxDuration = 60;

type Payload = {
  category?: string | null;
  categorySlugs?: string[] | null;
  product?: string | null;
  locales?: Locale[];
  comments?: number;
  lockKey?: string;
  productLimit?: number;
  skipGuides?: boolean;
  forceTech?: boolean;
  backfillMissing?: boolean;
  diversify?: boolean;
  chainRemaining?: number;
  fromCron?: boolean;
  force?: boolean;
  refreshShort?: boolean;
  respectDailyQuota?: boolean;
  dailyTarget?: number;
};

type ReviewContent = Parameters<typeof persistProductReview>[0]["content"];

export const { POST } = serve<Payload>(
  async (context) => {
    // Must read payload inside a step — otherwise context.call can stall
    // (Upstash caveat: requestPayload becomes undefined around call steps).
    const payload = await context.run("get-payload", () => {
      return context.requestPayload || {};
    });

    const lockKey = payload.lockKey || "cron:generate-content";
    const locales = (
      payload.locales?.length ? payload.locales : (["de"] as Locale[])
    ).filter((v): v is Locale => v === "de" || v === "en");
    const rawComments = Number(payload.comments);
    const commentCount = Number.isFinite(rawComments)
      ? Math.min(6, Math.max(0, rawComments))
      : 2;
    const primaryLocale = locales[0] ?? "de";
    const forceRegen = payload.force === true;
    const refreshShort = payload.refreshShort === true;
    const respectDailyQuota =
      payload.respectDailyQuota === true &&
      !forceRegen &&
      !refreshShort &&
      !payload.product;
    const dailyTarget = Number(payload.dailyTarget || DAILY_NEW_REVIEW_TARGET);
    const categorySlugs = (payload.categorySlugs || [])
      .map((slug) => String(slug).trim())
      .filter(Boolean);
    const diversify =
      payload.diversify !== false && !payload.category && categorySlugs.length !== 1;

    const quota = await context.run("daily-review-quota", async () => {
      if (!respectDailyQuota) {
        return {
          remaining: DAILY_NEW_REVIEW_TARGET,
          bypassed: true,
          target: dailyTarget,
        };
      }
      const remaining = await remainingDailyReviewSlots({ target: dailyTarget });
      return { remaining, bypassed: false, target: dailyTarget };
    });

    const requestedLimit = Math.min(
      20,
      Math.max(1, Number(payload.productLimit || DAILY_NEW_REVIEW_TARGET)),
    );
    const productLimit = respectDailyQuota
      ? Math.min(requestedLimit, quota.remaining, DAILY_NEW_REVIEW_TARGET)
      : requestedLimit;
    // No chaining when we honor the daily 3-review budget.
    const chainRemaining = respectDailyQuota
      ? 0
      : Math.max(0, Math.min(40, Number(payload.chainRemaining ?? 0)));

    if (respectDailyQuota && productLimit <= 0) {
      await context.run("release-lock-quota", async () => {
        await releaseLock(lockKey);
        return { released: true };
      });
      return {
        ok: true,
        skipped: true,
        reason: "daily_review_quota_reached",
        dailyTarget: quota.target,
        remainingSlots: 0,
      };
    }

    // Cron entry already holds the lock; chained follow-up runs must acquire it.
    if (!payload.fromCron) {
      const locked = await context.run("acquire-lock", async () => {
        return acquireLock(lockKey, 45 * 60);
      });
      if (!locked) {
        return {
          ok: true,
          skipped: true,
          reason: "lock_held",
          lockKey,
        };
      }
    }

    const backlogBefore = await context.run("count-backlog", async () => {
      return {
        products: await countProductsMissingReviews({
          locale: primaryLocale,
          categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
        }),
        categories: await countCategoriesWithReviewBacklog(primaryLocale),
      };
    });

    await context.run("publish-draft-reviews", async () => {
      const { resolveReviewPublishedAt } = await import(
        "@/lib/reviews/published-at"
      );
      const drafts = await prisma.article.findMany({
        where: {
          status: "needs_review",
          type: "review",
        },
        take: 50,
        select: {
          id: true,
          product: {
            select: {
              id: true,
              asin: true,
              createdAt: true,
              rawDetailsJson: true,
            },
          },
        },
      });

      let count = 0;
      for (const draft of drafts) {
        const publishedAt = draft.product
          ? resolveReviewPublishedAt({
              productId: draft.product.id,
              asin: draft.product.asin,
              rawDetailsJson: draft.product.rawDetailsJson,
              createdAt: draft.product.createdAt,
            })
          : new Date();
        await prisma.article.update({
          where: { id: draft.id },
          data: { status: "published", publishedAt },
        });
        count += 1;
      }
      return { count };
    });

    const products = await context.run("list-missing-reviews", async () => {
      if (payload.product) {
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { slug: payload.product },
              { asin: payload.product.toUpperCase() },
            ],
          },
          select: {
            id: true,
            asin: true,
            slug: true,
            category: { select: { id: true, slug: true } },
          },
        });
        if (!product) {
          throw new Error(`Product not found: ${payload.product}`);
        }
        return [
          {
            id: product.id,
            asin: product.asin,
            slug: product.slug,
            categoryId: product.category.id,
            categorySlug: product.category.slug,
          },
        ];
      }

      if (refreshShort) {
        const stale = await listProductsNeedingDetailedReviewRefresh({
          locale: primaryLocale,
          limit: productLimit,
          categorySlug: payload.category || null,
          categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
        });
        if (stale.length > 0) {
          return stale.map((item) => ({
            id: item.id,
            asin: item.asin,
            slug: item.slug,
            categoryId: item.categoryId,
            categorySlug: item.categorySlug,
          }));
        }
      }

      const missing = await listProductsMissingReviews({
        locale: primaryLocale,
        limit: productLimit,
        categorySlug: payload.category || null,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
        diversify,
      });

      return missing.map((item) => ({
        id: item.id,
        asin: item.asin,
        slug: item.slug,
        categoryId: item.categoryId,
        categorySlug: item.categorySlug,
      }));
    });

    if (products.length === 0) {
      await context.run("release-lock-empty", async () => {
        await releaseLock(lockKey);
        return { released: true };
      });
      return {
        ok: true,
        mode: "backfill",
        message: "No products missing published reviews",
        backlogBefore: backlogBefore.products,
        categoriesWithBacklog: backlogBefore.categories,
        backlogRemaining: 0,
        reviewsCreated: 0,
        commentsCreated: 0,
        techProfilesCreated: 0,
      };
    }

    const category = {
      id: products[0].categoryId,
      slug: products[0].categorySlug,
    };

    const reviews: Array<{ productId: string; locale: Locale; id: string }> =
      [];
    const comments: Array<{
      productId: string;
      locale: Locale;
      count: number;
    }> = [];
    const techProfiles: Array<{
      productId: string;
      specs: number;
      issues: number;
      codes: number;
    }> = [];

    for (const product of products) {
      const shouldGenerateTech = await context.run(
        `check-tech-${product.asin}`,
        async () => {
          if (payload.forceTech) return true;
          const row = await prisma.product.findUnique({
            where: { id: product.id },
            select: { techProfileAt: true, specsJson: true },
          });
          return !row?.techProfileAt || !row.specsJson;
        },
      );

      if (shouldGenerateTech) {
        const preparedTech = await context.run(
          `prep-tech-${product.asin}`,
          async () => prepareProductTechProfile(product.id),
        );

        const techBody = await context.run(
          `cfg-tech-${product.asin}`,
          async () =>
            buildOpenRouterJsonBody({
              messages: preparedTech.messages,
              temperature: preparedTech.temperature,
              plugins: preparedTech.plugins,
            }),
        );

        const techAi = await context.call<OpenRouterChatCompletionResponse>(
          `ai-tech-${product.asin}`,
          {
            url: OPENROUTER_CHAT_URL,
            method: "POST",
            headers: getOpenRouterAuthHeaders(),
            body: JSON.stringify(techBody),
            retries: 1,
            timeout: "180s",
          },
        );

        if (techAi.status < 200 || techAi.status >= 300) {
          // Fallback without web plugin
          const techBodyPlain = await context.run(
            `cfg-tech-plain-${product.asin}`,
            async () =>
              buildOpenRouterJsonBody({
                messages: preparedTech.messages,
                temperature: preparedTech.temperature,
              }),
          );
          const techAiPlain =
            await context.call<OpenRouterChatCompletionResponse>(
              `ai-tech-plain-${product.asin}`,
              {
                url: OPENROUTER_CHAT_URL,
                method: "POST",
                headers: getOpenRouterAuthHeaders(),
                body: JSON.stringify(techBodyPlain),
                retries: 1,
                timeout: "180s",
              },
            );

          if (techAiPlain.status >= 200 && techAiPlain.status < 300) {
            const savedTech = await context.run(
              `save-tech-plain-${product.asin}`,
              async () => {
                const payloadJson =
                  parseOpenRouterJsonContent<ProductTechProfileAiResponse>(
                    techAiPlain.body,
                  );
                const normalized = await persistProductTechProfile({
                  productId: preparedTech.productId,
                  jobId: preparedTech.jobId,
                  payload: payloadJson,
                });
                return {
                  productId: product.id,
                  specs: normalized.datasheet.rows.length,
                  issues: normalized.knownIssues.issues.length,
                  codes: normalized.errorCodes.codes.length,
                };
              },
            );
            techProfiles.push(savedTech);
          } else {
            await context.run(`fail-tech-${product.asin}`, async () => {
              await failJob(
                preparedTech.jobId,
                new Error(`OpenRouter HTTP ${techAiPlain.status}`),
              );
              return { failed: true, status: techAiPlain.status };
            });
          }
        } else {
          const savedTech = await context.run(
            `save-tech-${product.asin}`,
            async () => {
              const payloadJson =
                parseOpenRouterJsonContent<ProductTechProfileAiResponse>(
                  techAi.body,
                );
              const normalized = await persistProductTechProfile({
                productId: preparedTech.productId,
                jobId: preparedTech.jobId,
                payload: payloadJson,
              });
              return {
                productId: product.id,
                specs: normalized.datasheet.rows.length,
                issues: normalized.knownIssues.issues.length,
                codes: normalized.errorCodes.codes.length,
              };
            },
          );
          techProfiles.push(savedTech);
        }
      }

      for (const locale of locales) {
        const shouldWriteReview = await context.run(
          `need-review-${product.asin}-${locale}`,
          async () => {
            if (forceRegen || refreshShort) return true;
            const existing = await prisma.article.findFirst({
              where: {
                productId: product.id,
                type: "review",
                locale,
                status: "published",
              },
              select: { id: true },
            });
            return !existing;
          },
        );
        if (!shouldWriteReview) continue;

        const prepared = await context.run(
          `prep-review-${product.asin}-${locale}`,
          async () => prepareProductReview(product.id, locale),
        );

        const reviewBody = await context.run(
          `cfg-review-${product.asin}-${locale}`,
          async () =>
            buildOpenRouterJsonBody({
              messages: prepared.messages,
              temperature: prepared.temperature,
              maxTokens: prepared.maxTokens,
              model: prepared.model,
            }),
        );

        const ai = await context.call<OpenRouterChatCompletionResponse>(
          `ai-review-${product.asin}-${locale}`,
          {
            url: OPENROUTER_CHAT_URL,
            method: "POST",
            headers: getOpenRouterAuthHeaders(),
            body: JSON.stringify(reviewBody),
            retries: 2,
            timeout: "180s",
          },
        );

        let reviewSaved = false;
        if (ai.status >= 200 && ai.status < 300) {
          const savedReview = await context.run(
            `save-review-${product.asin}-${locale}`,
            async () => {
              try {
                const content = parseOpenRouterJsonContent<ReviewContent>(
                  ai.body,
                );
                const article = await persistProductReview({
                  productId: prepared.productId,
                  locale: prepared.locale,
                  jobId: prepared.jobId,
                  categorySlug: prepared.categorySlug,
                  content,
                });
                return {
                  ok: true as const,
                  id: article.id,
                  productId: product.id,
                  locale,
                };
              } catch (error) {
                return {
                  ok: false as const,
                  error:
                    error instanceof Error ? error.message : "parse_failed",
                };
              }
            },
          );
          if (savedReview.ok) {
            reviews.push(savedReview);
            reviewSaved = true;
          }
        }

        // Paid quota / weak free models: try a short list of JSON-capable free models.
        if (!reviewSaved) {
          const fallbackModels = [
            getOpenRouterFallbackModel(prepared.model),
            ...OPENROUTER_FREE_REVIEW_MODELS,
          ].filter(
            (model, index, all) =>
              model !== prepared.model && all.indexOf(model) === index,
          );

          for (const [index, fallbackModel] of fallbackModels
            .slice(0, 2)
            .entries()) {
            if (reviewSaved) break;
            const suffix = index === 0 ? "fallback" : `fallback${index + 1}`;
            const fallbackBody = await context.run(
              `cfg-review-${suffix}-${product.asin}-${locale}`,
              async () =>
                buildOpenRouterJsonBody({
                  messages: [
                    ...prepared.messages,
                    {
                      role: "user",
                      content:
                        prepared.locale === "de"
                          ? "Antworte NUR mit einem gültigen JSON-Objekt gemäß Schema. Erstes Zeichen {, letztes }. Kein Thinking, kein Markdown, kein Text."
                          : "Reply with a valid JSON object only. First char {, last }. No thinking, no markdown, no prose.",
                    },
                  ],
                  temperature: 0.3,
                  maxTokens: Math.min(prepared.maxTokens || 7000, 7000),
                  model: fallbackModel,
                }),
            );

            const aiFallback =
              await context.call<OpenRouterChatCompletionResponse>(
                `ai-review-${suffix}-${product.asin}-${locale}`,
                {
                  url: OPENROUTER_CHAT_URL,
                  method: "POST",
                  headers: getOpenRouterAuthHeaders(),
                  body: JSON.stringify(fallbackBody),
                  retries: 1,
                  timeout: "180s",
                },
              );

            if (aiFallback.status < 200 || aiFallback.status >= 300) {
              continue;
            }

            const savedFallback = await context.run(
              `save-review-${suffix}-${product.asin}-${locale}`,
              async () => {
                try {
                  const content = parseOpenRouterJsonContent<ReviewContent>(
                    aiFallback.body,
                  );
                  const article = await persistProductReview({
                    productId: prepared.productId,
                    locale: prepared.locale,
                    jobId: prepared.jobId,
                    categorySlug: prepared.categorySlug,
                    content,
                  });
                  return {
                    ok: true as const,
                    id: article.id,
                    productId: product.id,
                    locale,
                  };
                } catch (error) {
                  return {
                    ok: false as const,
                    error:
                      error instanceof Error ? error.message : "parse_failed",
                  };
                }
              },
            );

            if (savedFallback.ok) {
              reviews.push(savedFallback);
              reviewSaved = true;
            }
          }

          if (!reviewSaved) {
            await context.run(
              `fail-review-${product.asin}-${locale}`,
              async () => {
                await failJob(
                  prepared.jobId,
                  new Error(
                    `OpenRouter review failed (primary HTTP ${ai.status}; free fallbacks produced no valid JSON). Check OPENROUTER_API_KEY credits / OPENROUTER_REVIEW_MODEL.`,
                  ),
                );
                return { failed: true };
              },
            );
          }
        }

        if (commentCount <= 0) {
          continue;
        }

        const preparedComments = await context.run(
          `prep-comments-${product.asin}-${locale}`,
          async () =>
            prepareProductExperienceComments(product.id, locale, commentCount),
        );

        const commentsBody = await context.run(
          `cfg-comments-${product.asin}-${locale}`,
          async () =>
            buildOpenRouterJsonBody({
              messages: preparedComments.messages,
              temperature: preparedComments.temperature,
            }),
        );

        const commentsAi = await context.call<OpenRouterChatCompletionResponse>(
          `ai-comments-${product.asin}-${locale}`,
          {
            url: OPENROUTER_CHAT_URL,
            method: "POST",
            headers: getOpenRouterAuthHeaders(),
            body: JSON.stringify(commentsBody),
            retries: 1,
            timeout: "120s",
          },
        );

        if (commentsAi.status >= 200 && commentsAi.status < 300) {
          const savedComments = await context.run(
            `save-comments-${product.asin}-${locale}`,
            async () => {
              const payloadJson = parseOpenRouterJsonContent<{
                comments: Array<{
                  authorName: string;
                  authorContext?: string;
                  rating: number;
                  title?: string;
                  body: string;
                  usageWeeks?: number;
                }>;
              }>(commentsAi.body);
              const rows = await persistProductExperienceComments({
                productId: preparedComments.productId,
                locale: preparedComments.locale,
                jobId: preparedComments.jobId,
                payload: payloadJson,
              });
              return {
                productId: product.id,
                locale,
                count: rows.length,
              };
            },
          );
          comments.push(savedComments);
        } else {
          await context.run(
            `fail-comments-${product.asin}-${locale}`,
            async () => {
              await failJob(
                preparedComments.jobId,
                new Error(`OpenRouter HTTP ${commentsAi.status}`),
              );
              return { failed: true, status: commentsAi.status };
            },
          );
        }
      }
    }

    const backlogRemaining = await context.run("count-backlog-after", async () => {
      return {
        products: await countProductsMissingReviews({
          locale: primaryLocale,
          categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
        }),
        categories: await countCategoriesWithReviewBacklog(primaryLocale),
      };
    });

    const categoriesTouched = [
      ...new Set(products.map((product) => product.categorySlug)),
    ];

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
      return { released: true };
    });

    // Keep draining missing reviews; once empty, chain into short-review refresh.
    let chained: { workflowRunId?: string; remaining?: number } | null = null;
    if (chainRemaining > 0) {
      if (backlogRemaining.products > 0) {
        chained = await context.run("chain-next-backfill", async () => {
          const next = await triggerWorkflow(
            "/api/workflows/generate-content",
            {
              category: payload.category || null,
              categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
              locales,
              comments: commentCount,
              productLimit,
              skipGuides: true,
              forceTech: false,
              force: false,
              refreshShort: false,
              backfillMissing: true,
              diversify,
              chainRemaining: chainRemaining - 1,
              fromCron: false,
              lockKey,
            },
            { delaySeconds: 45 },
          );
          return {
            workflowRunId: next.workflowRunId,
            remaining: chainRemaining - 1,
          };
        });
      } else if (refreshShort || reviews.length > 0) {
        chained = await context.run("chain-next-refresh", async () => {
          const staleLeft = await listProductsNeedingDetailedReviewRefresh({
            locale: primaryLocale,
            limit: 1,
            categorySlug: payload.category || null,
            categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
          });
          if (staleLeft.length === 0) {
            return { remaining: chainRemaining - 1 };
          }
          const next = await triggerWorkflow(
            "/api/workflows/generate-content",
            {
              category: payload.category || null,
              categorySlugs: categorySlugs.length > 0 ? categorySlugs : null,
              locales,
              comments: commentCount,
              productLimit,
              skipGuides: true,
              forceTech: false,
              force: true,
              refreshShort: true,
              backfillMissing: true,
              diversify,
              chainRemaining: chainRemaining - 1,
              fromCron: false,
              lockKey,
            },
            { delaySeconds: 45 },
          );
          return {
            workflowRunId: next.workflowRunId,
            remaining: chainRemaining - 1,
          };
        });
      }
    }

    return {
      ok: true,
      mode: "backfill",
      category: category.slug,
      categoriesTouched,
      backlogBefore: backlogBefore.products,
      categoriesWithBacklog: backlogBefore.categories,
      backlogRemaining: backlogRemaining.products,
      categoriesWithBacklogRemaining: backlogRemaining.categories,
      productsProcessed: products.length,
      reviewsCreated: reviews.length,
      commentsCreated: comments.reduce((sum, c) => sum + c.count, 0),
      techProfilesCreated: techProfiles.length,
      chained,
      reviews,
      comments,
      techProfiles,
    };
  },
  {
    // Prevent URL inference issues that stall workflows after the first steps.
    baseUrl: getWorkflowBaseUrl(),
    failureFunction: async ({ context }) => {
      const lockKey =
        context.requestPayload?.lockKey || "cron:generate-content";
      await releaseLock(lockKey);
    },
  },
);
