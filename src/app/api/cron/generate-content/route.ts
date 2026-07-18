import { NextRequest, NextResponse } from "next/server";
import { resolveCronCategory } from "@/lib/cron";
import { prisma } from "@/lib/db/prisma";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";
import {
  generateCategoryComparison,
  generateBuyingGuide,
  generateProductExperienceComments,
  generateProductReview,
} from "@/lib/ai/generate";
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
  const productLimit = Number(req.nextUrl.searchParams.get("products") || 1);
  const force = req.nextUrl.searchParams.get("force") === "1";
  // Guides/comparisons are opt-in — reviews first (avoids extra OpenRouter timeouts).
  const skipGuides = req.nextUrl.searchParams.get("guides") !== "1";

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
          lockKey: "cron:generate-content",
        },
      },
      async () => {
        return withDbRetry(async () => {
          let categoryId: string;
          let categorySlug: string;
          let products: Array<{ id: string }> = [];

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
            categoryId = row.category.id;
            categorySlug = row.category.slug;
            products = [{ id: row.id }];
          } else {
            const category = await resolveCronCategory(slug);
            if (!category) {
              throw new Error("No category found. Run /api/cron/setup first.");
            }
            categoryId = category.id;
            categorySlug = category.slug;
            products = await prisma.product.findMany({
              where: {
                categoryId,
                articles: {
                  none: {
                    type: "review",
                    locale: locales[0] ?? "de",
                    status: "published",
                  },
                },
              },
              orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
              take: productLimit,
              select: { id: true },
            });
          }

          const reviews = [];
          const comments = [];
          for (const item of products) {
            for (const locale of locales) {
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

          if (!skipGuides) {
            for (const locale of locales) {
              await generateCategoryComparison(categoryId, locale);
              await generateBuyingGuide(categoryId, locale);
            }
          }

          await enrichCategoryManuals(categoryId, locales[0] ?? "de");

          return {
            category: categorySlug,
            reviewsCreated: reviews.length,
            commentsCreated: comments.reduce((sum, c) => sum + c.count, 0),
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
