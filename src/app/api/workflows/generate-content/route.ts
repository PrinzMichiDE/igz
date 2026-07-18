import { serve } from "@upstash/workflow/nextjs";
import {
  failJob,
  persistProductExperienceComments,
  persistProductReview,
  prepareProductExperienceComments,
  prepareProductReview,
} from "@/lib/ai/generate";
import {
  OPENROUTER_CHAT_URL,
  buildOpenRouterJsonBody,
  getOpenRouterAuthHeaders,
  parseOpenRouterJsonContent,
  type OpenRouterChatCompletionResponse,
} from "@/lib/ai/openrouter-request";
import { resolveCronCategory } from "@/lib/cron";
import { prisma } from "@/lib/db/prisma";
import { getWorkflowBaseUrl } from "@/lib/upstash/qstash";
import { releaseLock } from "@/lib/upstash/redis";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Keep short — OpenRouter waits happen in context.call (outside Vercel). */
export const maxDuration = 60;

type Payload = {
  category?: string | null;
  product?: string | null;
  locales?: Locale[];
  comments?: number;
  lockKey?: string;
  productLimit?: number;
  skipGuides?: boolean;
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
    const commentCount = Math.min(
      6,
      Math.max(2, Number(payload.comments || 3)),
    );
    const productLimit = Math.min(
      3,
      Math.max(1, Number(payload.productLimit || 1)),
    );

    const category = await context.run("resolve-category", async () => {
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
        return {
          id: product.category.id,
          slug: product.category.slug,
          productIds: [
            { id: product.id, asin: product.asin, slug: product.slug },
          ],
        };
      }

      const resolved = await resolveCronCategory(payload.category || null);
      if (!resolved) {
        throw new Error("No category found. Run setup first.");
      }
      return { id: resolved.id, slug: resolved.slug, productIds: null };
    });

    await context.run("publish-backlog", async () => {
      const publishedBacklog = await prisma.article.updateMany({
        where: {
          status: "needs_review",
          type: "review",
          product: { categoryId: category.id },
        },
        data: {
          status: "published",
          publishedAt: new Date(),
        },
      });
      return { count: publishedBacklog.count };
    });

    const products = await context.run("list-products", async () => {
      if (category.productIds) return category.productIds;

      const primaryLocale = locales[0] ?? "de";
      const missing = await prisma.product.findMany({
        where: {
          categoryId: category.id,
          articles: {
            none: {
              type: "review",
              locale: primaryLocale,
              status: "published",
            },
          },
        },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: productLimit,
        select: { id: true, asin: true, slug: true },
      });
      if (missing.length > 0) return missing;

      return prisma.product.findMany({
        where: { categoryId: category.id },
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: productLimit,
        select: { id: true, asin: true, slug: true },
      });
    });

    const reviews: Array<{ productId: string; locale: Locale; id: string }> =
      [];
    const comments: Array<{
      productId: string;
      locale: Locale;
      count: number;
    }> = [];

    for (const product of products) {
      for (const locale of locales) {
        const prepared = await context.run(
          `prep-review-${product.asin}-${locale}`,
          async () => prepareProductReview(product.id, locale),
        );

        const callConfig = await context.run(
          `cfg-review-${product.asin}-${locale}`,
          async () => ({
            headers: getOpenRouterAuthHeaders(),
            body: buildOpenRouterJsonBody({
              messages: prepared.messages,
              temperature: prepared.temperature,
            }),
          }),
        );

        const ai = await context.call<OpenRouterChatCompletionResponse>(
          `ai-review-${product.asin}-${locale}`,
          {
            url: OPENROUTER_CHAT_URL,
            method: "POST",
            headers: callConfig.headers,
            body: JSON.stringify(callConfig.body),
            retries: 2,
            timeout: 180,
          },
        );

        if (ai.status < 200 || ai.status >= 300) {
          await context.run(`fail-review-${product.asin}-${locale}`, async () => {
            await failJob(
              prepared.jobId,
              new Error(`OpenRouter HTTP ${ai.status}`),
            );
            return { failed: true, status: ai.status };
          });
        } else {
          const savedReview = await context.run(
            `save-review-${product.asin}-${locale}`,
            async () => {
              const content = parseOpenRouterJsonContent<ReviewContent>(ai.body);
              const article = await persistProductReview({
                productId: prepared.productId,
                locale: prepared.locale,
                jobId: prepared.jobId,
                content,
              });
              return { id: article.id, productId: product.id, locale };
            },
          );
          reviews.push(savedReview);
        }

        const preparedComments = await context.run(
          `prep-comments-${product.asin}-${locale}`,
          async () =>
            prepareProductExperienceComments(product.id, locale, commentCount),
        );

        const commentsConfig = await context.run(
          `cfg-comments-${product.asin}-${locale}`,
          async () => ({
            headers: getOpenRouterAuthHeaders(),
            body: buildOpenRouterJsonBody({
              messages: preparedComments.messages,
              temperature: preparedComments.temperature,
            }),
          }),
        );

        const commentsAi = await context.call<OpenRouterChatCompletionResponse>(
          `ai-comments-${product.asin}-${locale}`,
          {
            url: OPENROUTER_CHAT_URL,
            method: "POST",
            headers: commentsConfig.headers,
            body: JSON.stringify(commentsConfig.body),
            retries: 1,
            timeout: 120,
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

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
      return { released: true };
    });

    return {
      ok: true,
      category: category.slug,
      reviewsCreated: reviews.length,
      commentsCreated: comments.reduce((sum, c) => sum + c.count, 0),
      reviews,
      comments,
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
