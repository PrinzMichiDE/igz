import { NextRequest, NextResponse } from "next/server";
import {
  countProductsMissingReviews,
  listProductsMissingReviews,
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
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("category");
  const product = req.nextUrl.searchParams.get("product");
  const locales = (req.nextUrl.searchParams.get("locales") || "de")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const commentCount = Number(req.nextUrl.searchParams.get("comments") || 3);
  // Default batch size for automatic backlog catch-up.
  const productLimit = Number(req.nextUrl.searchParams.get("products") || 3);
  const force = req.nextUrl.searchParams.get("force") === "1";
  // Guides/comparisons are opt-in — reviews first (avoids extra OpenRouter timeouts).
  const skipGuides = req.nextUrl.searchParams.get("guides") !== "1";
  const forceTech =
    force || req.nextUrl.searchParams.get("tech") === "1";
  const primaryLocale = locales[0] ?? "de";

  try {
    return await enqueueOrRunInline(
      {
        lockKey: "cron:generate-content",
        workflowPath: "/api/workflows/generate-content",
        lockTtlSeconds: 25 * 60,
        force,
        body: {
          category: slug,
          product,
          locales,
          comments: commentCount,
          productLimit,
          skipGuides,
          forceTech,
          backfillMissing: true,
          lockKey: "cron:generate-content",
        },
      },
      async () => {
        return withDbRetry(async () => {
          const backlogBefore = await countProductsMissingReviews({
            locale: primaryLocale,
            categoryId: null,
          });

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
          } else {
            const missing = await listProductsMissingReviews({
              locale: primaryLocale,
              limit: productLimit,
              categorySlug: slug,
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
              reviewsCreated: 0,
              commentsCreated: 0,
              techProfilesCreated: 0,
            };
          }

          const reviews = [];
          const comments = [];
          const techProfiles = [];

          for (const item of products) {
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
              if (alreadyHasReview && !force) {
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

          // Optional guides only for the first touched category.
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
