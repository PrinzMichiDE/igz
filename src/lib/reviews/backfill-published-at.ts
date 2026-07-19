import { prisma } from "@/lib/db/prisma";
import { resolveReviewPublishedAt } from "@/lib/reviews/published-at";

/**
 * Align published review dates with product age (Amazon first-available,
 * else product.createdAt; pre-2020 → stable date in 2020…now).
 */
export async function backfillReviewPublishedDates(options?: {
  limit?: number;
  dryRun?: boolean;
}) {
  const limit = Math.min(500, Math.max(1, options?.limit ?? 200));
  const dryRun = options?.dryRun === true;

  const articles = await prisma.article.findMany({
    where: {
      type: "review",
      status: "published",
      productId: { not: null },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: {
      id: true,
      publishedAt: true,
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

  let updated = 0;
  let skipped = 0;
  const samples: Array<{
    articleId: string;
    from: string | null;
    to: string;
  }> = [];

  for (const article of articles) {
    if (!article.product) {
      skipped += 1;
      continue;
    }

    const next = resolveReviewPublishedAt({
      productId: article.product.id,
      asin: article.product.asin,
      rawDetailsJson: article.product.rawDetailsJson,
      createdAt: article.product.createdAt,
    });

    const prev = article.publishedAt;
    const sameDay =
      prev &&
      prev.getUTCFullYear() === next.getUTCFullYear() &&
      prev.getUTCMonth() === next.getUTCMonth() &&
      prev.getUTCDate() === next.getUTCDate();

    if (sameDay) {
      skipped += 1;
      continue;
    }

    if (!dryRun) {
      await prisma.article.update({
        where: { id: article.id },
        data: { publishedAt: next },
      });
    }

    updated += 1;
    if (samples.length < 8) {
      samples.push({
        articleId: article.id,
        from: prev ? prev.toISOString() : null,
        to: next.toISOString(),
      });
    }
  }

  return {
    scanned: articles.length,
    updated,
    skipped,
    dryRun,
    samples,
  };
}
