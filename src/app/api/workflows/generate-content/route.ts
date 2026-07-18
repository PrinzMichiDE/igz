import { serve } from "@upstash/workflow/nextjs";
import {
  generateBuyingGuide,
  generateCategoryComparison,
  generateProductExperienceComments,
  generateProductReview,
} from "@/lib/ai/generate";
import { resolveCronCategory } from "@/lib/cron";
import { prisma } from "@/lib/db/prisma";
import { enrichCategoryManuals } from "@/lib/product-manuals";
import { releaseLock } from "@/lib/upstash/redis";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Payload = {
  category?: string | null;
  locales?: Locale[];
  comments?: number;
  lockKey?: string;
  productLimit?: number;
};

export const { POST } = serve<Payload>(
  async (context) => {
    const payload = context.requestPayload || {};
    const lockKey = payload.lockKey || "cron:generate-content";
    const locales = (
      payload.locales?.length ? payload.locales : (["de", "en"] as Locale[])
    ).filter((v): v is Locale => v === "de" || v === "en");
    const commentCount = Math.min(
      8,
      Math.max(3, Number(payload.comments || 4)),
    );
    const productLimit = Math.min(
      5,
      Math.max(1, Number(payload.productLimit || 3)),
    );

    const category = await context.run("resolve-category", async () => {
      const resolved = await resolveCronCategory(payload.category || null);
      if (!resolved) {
        throw new Error("No category found. Run setup first.");
      }
      return { id: resolved.id, slug: resolved.slug };
    });

    const backlog = await context.run("publish-backlog", async () => {
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
        const review = await context.run(
          `review-${product.asin}-${locale}`,
          async () => {
            const article = await generateProductReview(product.id, locale);
            return { id: article.id, productId: product.id, locale };
          },
        );
        reviews.push(review);

        const saved = await context.run(
          `comments-${product.asin}-${locale}`,
          async () => {
            const rows = await generateProductExperienceComments(
              product.id,
              locale,
              commentCount,
            );
            return {
              productId: product.id,
              locale,
              count: rows.length,
            };
          },
        );
        comments.push(saved);
      }
    }

    const comparisons = [];
    const buyingGuides = [];
    for (const locale of locales) {
      const comparison = await context.run(`comparison-${locale}`, async () => {
        const article = await generateCategoryComparison(category.id, locale);
        return { locale, id: article.id };
      });
      comparisons.push(comparison);

      const guide = await context.run(`buying-guide-${locale}`, async () => {
        const article = await generateBuyingGuide(category.id, locale);
        return { locale, id: article.id };
      });
      buyingGuides.push(guide);
    }

    const manuals = await context.run("manuals", async () => {
      return enrichCategoryManuals(category.id, locales[0] ?? "de");
    });

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
      return { released: true };
    });

    return {
      ok: true,
      category: category.slug,
      backlog,
      reviewsCreated: reviews.length,
      commentsCreated: comments.reduce((sum, c) => sum + c.count, 0),
      comparisonsCreated: comparisons.length,
      buyingGuidesCreated: buyingGuides.length,
      manualsEnriched: manuals.length,
      reviews,
      comments,
      comparisons,
      buyingGuides,
    };
  },
  {
    failureFunction: async ({ context }) => {
      const lockKey =
        context.requestPayload?.lockKey || "cron:generate-content";
      await releaseLock(lockKey);
    },
  },
);
