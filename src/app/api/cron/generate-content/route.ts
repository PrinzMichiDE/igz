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
  const locales = (req.nextUrl.searchParams.get("locales") || "de,en")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const commentCount = Number(req.nextUrl.searchParams.get("comments") || 4);
  const productLimit = Number(req.nextUrl.searchParams.get("products") || 3);

  try {
    return await enqueueOrRunInline(
      {
        lockKey: "cron:generate-content",
        workflowPath: "/api/workflows/generate-content",
        body: {
          category: slug,
          locales,
          comments: commentCount,
          productLimit,
          lockKey: "cron:generate-content",
        },
      },
      async () => {
        return withDbRetry(async () => {
          const category = await resolveCronCategory(slug);
          if (!category) {
            throw new Error("No category found. Run /api/cron/setup first.");
          }

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

          const products = await prisma.product.findMany({
            where: { categoryId: category.id },
            orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
            take: productLimit,
          });

          const reviews = [];
          const comments = [];
          for (const product of products) {
            for (const locale of locales) {
              const article = await generateProductReview(product.id, locale);
              reviews.push({
                productId: product.id,
                locale,
                id: article.id,
              });
              const savedComments = await generateProductExperienceComments(
                product.id,
                locale,
                commentCount,
              );
              comments.push({
                productId: product.id,
                locale,
                count: savedComments.length,
              });
            }
          }

          const comparisons = [];
          const buyingGuides = [];
          for (const locale of locales) {
            const article = await generateCategoryComparison(
              category.id,
              locale,
            );
            comparisons.push({ locale, id: article.id });
            const guide = await generateBuyingGuide(category.id, locale);
            buyingGuides.push({ locale, id: guide.id });
          }

          const manuals = await enrichCategoryManuals(
            category.id,
            locales[0] ?? "de",
          );

          return {
            category: category.slug,
            reviewsPublishedFromBacklog: publishedBacklog.count,
            reviewsCreated: reviews.length,
            commentsCreated: comments.reduce((sum, c) => sum + c.count, 0),
            comparisonsCreated: comparisons.length,
            buyingGuidesCreated: buyingGuides.length,
            manualsEnriched: manuals.length,
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
