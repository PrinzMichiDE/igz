import { NextRequest, NextResponse } from "next/server";
import {
  countCategoriesWithReviewBacklog,
  countProductsMissingReviews,
  listProductsMissingReviews,
  listProductsNeedingDetailedReviewRefresh,
} from "@/lib/content-backfill";
import { prisma } from "@/lib/db/prisma";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";
import {
  generateCategoryComparison,
  generateBuyingGuide,
  generateProductExperienceComments,
  generateProductReview,
} from "@/lib/ai/generate";
import { generateProductTechProfile } from "@/lib/ai/generate-tech-profile";
import { enrichCategoryManuals } from "@/lib/product-manuals";
import {
  DAILY_NEW_REVIEW_TARGET,
  remainingDailyReviewSlots,
} from "@/lib/review-daily-quota";
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Default: 3 diversified new tests/day — no chaining. */
function defaultBatchSize() {
  return DAILY_NEW_REVIEW_TARGET;
}

function defaultChainRemaining() {
  return 0;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("category");
  const product = req.nextUrl.searchParams.get("product");
  const locales = (req.nextUrl.searchParams.get("locales") || "de")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const rawComments = req.nextUrl.searchParams.get("comments");
  const commentCount =
    rawComments == null || rawComments === ""
      ? 3
      : Math.min(6, Math.max(0, Number(rawComments)));
  const requestedLimit = Number(
    req.nextUrl.searchParams.get("products") || defaultBatchSize(),
  );
  const chainRemaining = Number(
    req.nextUrl.searchParams.get("chain") || defaultChainRemaining(),
  );
  const force = req.nextUrl.searchParams.get("force") === "1";
  // Refresh short/old reviews into the 7-section detailed format.
  const refreshShort =
    req.nextUrl.searchParams.get("refresh") === "1" ||
    req.nextUrl.searchParams.get("detailed") === "1";
  // Guides/comparisons are opt-in — reviews first (avoids extra OpenRouter timeouts).
  const skipGuides = req.nextUrl.searchParams.get("guides") !== "1";
  // Tech refresh is opt-in — don't burn OpenRouter quota on every review rewrite.
  const forceTech = req.nextUrl.searchParams.get("tech") === "1";
  const forceRegen = refreshShort || (force && Boolean(product));
  const primaryLocale = locales[0] ?? "de";
  const bypassDailyQuota = Boolean(product) || refreshShort || force;
  const dailySlots = await remainingDailyReviewSlots({
    bypass: bypassDailyQuota,
  });
  const productLimit = bypassDailyQuota
    ? Math.min(20, Math.max(1, requestedLimit))
    : Math.min(DAILY_NEW_REVIEW_TARGET, Math.max(0, dailySlots), requestedLimit);

  try {
    if (!bypassDailyQuota && productLimit <= 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "daily_review_quota_reached",
        dailyTarget: DAILY_NEW_REVIEW_TARGET,
        remainingSlots: 0,
      });
    }

    return await enqueueOrRunInline(
      {
        lockKey: "cron:generate-content",
        workflowPath: "/api/workflows/generate-content",
        lockTtlSeconds: 45 * 60,
        force,
        body: {
          category: slug,
          product,
          locales,
          comments: commentCount,
          productLimit: Math.max(1, productLimit),
          skipGuides,
          forceTech,
          force: forceRegen,
          refreshShort,
          backfillMissing: true,
          diversify: !slug,
          respectDailyQuota: !bypassDailyQuota,
          dailyTarget: DAILY_NEW_REVIEW_TARGET,
          chainRemaining: Math.max(0, Math.min(40, chainRemaining)),
          fromCron: true,
          lockKey: "cron:generate-content",
        },
      },
      async () => {
        return withDbRetry(async () => {
          const backlogBefore = await countProductsMissingReviews({
            locale: primaryLocale,
          });
          const categoriesWithBacklog = await countCategoriesWithReviewBacklog(
            primaryLocale,
          );

          let products: Array<{
            id: string;
            categoryId: string;
            categorySlug: string;
          }> = [];

          if (product) {
            const row = await prisma.product.findFirst({
              where: {
                OR: [{ slug: product }, { asin: product.toUpperCase() }],
              },
              select: {
                id: true,
                category: { select: { id: true, slug: true } },
              },
            });
            if (!row) throw new Error(`Product not found: ${product}`);
            products = [
              {
                id: row.id,
                categoryId: row.category.id,
                categorySlug: row.category.slug,
              },
            ];
          } else if (refreshShort) {
            const stale = await listProductsNeedingDetailedReviewRefresh({
              locale: primaryLocale,
              limit: Math.max(1, productLimit),
              categorySlug: slug,
            });
            products = stale.map((item) => ({
              id: item.id,
              categoryId: item.categoryId,
              categorySlug: item.categorySlug,
            }));
          } else {
            const missing = await listProductsMissingReviews({
              locale: primaryLocale,
              limit: Math.max(1, productLimit),
              categorySlug: slug,
              diversify: !slug,
            });
            products = missing.map((item) => ({
              id: item.id,
              categoryId: item.categoryId,
              categorySlug: item.categorySlug,
            }));
          }

          if (products.length === 0) {
            return {
              ok: true,
              mode: "backfill",
              message: "No products missing published reviews",
              backlogRemaining: 0,
              categoriesWithBacklog: 0,
              reviewsCreated: 0,
              commentsCreated: 0,
              techProfilesCreated: 0,
            };
          }

          const reviews = [];
          const comments = [];
          const techProfiles = [];
          const touchedCategories = new Set<string>();

          for (const item of products) {
            touchedCategories.add(item.categorySlug);
            const existing = await prisma.product.findUnique({
              where: { id: item.id },
              select: { techProfileAt: true, specsJson: true },
            });
            if (forceTech || !existing?.techProfileAt || !existing.specsJson) {
              const tech = await generateProductTechProfile(item.id);
              techProfiles.push({
                productId: item.id,
                specs: tech.datasheet.rows.length,
                issues: tech.knownIssues.issues.length,
                codes: tech.errorCodes.codes.length,
              });
            }

            for (const locale of locales) {
              const alreadyHasReview = await prisma.article.findFirst({
                where: {
                  productId: item.id,
                  type: "review",
                  locale,
                  status: "published",
                },
                select: { id: true },
              });
              if (alreadyHasReview && !forceRegen) {
                continue;
              }

              const article = await generateProductReview(item.id, locale);
              reviews.push({ productId: item.id, locale, id: article.id });
              const saved = await generateProductExperienceComments(
                item.id,
                locale,
                commentCount,
              );
              comments.push({
                productId: item.id,
                locale,
                count: saved.length,
              });
            }
          }

          const primaryCategoryId = products[0]?.categoryId;
          const primaryCategorySlug = products[0]?.categorySlug;
          if (!skipGuides && primaryCategoryId) {
            for (const locale of locales) {
              await generateCategoryComparison(primaryCategoryId, locale);
              await generateBuyingGuide(primaryCategoryId, locale);
            }
            await enrichCategoryManuals(primaryCategoryId, primaryLocale);
          } else if (primaryCategoryId) {
            await enrichCategoryManuals(primaryCategoryId, primaryLocale);
          }

          const backlogAfter = await countProductsMissingReviews({
            locale: primaryLocale,
          });

          return {
            ok: true,
            mode: "backfill",
            category: primaryCategorySlug || slug,
            categoriesTouched: [...touchedCategories],
            categoriesWithBacklog,
            backlogBefore,
            backlogRemaining: backlogAfter,
            productsProcessed: products.length,
            reviewsCreated: reviews.length,
            commentsCreated: comments.reduce((sum, c) => sum + c.count, 0),
            techProfilesCreated: techProfiles.length,
            products: products.map((p) => p.id),
          };
        });
      },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
