import { prisma } from "@/lib/db/prisma";
import type { Locale } from "@prisma/client";

export type MissingReviewProduct = {
  id: string;
  asin: string;
  slug: string;
  title: string;
  rating: number | null;
  reviewCount: number;
  categoryId: string;
  categorySlug: string;
};

/**
 * Find products that still need a published review for the given locale.
 * Round-robins across categories so every category with a backlog gets coverage,
 * instead of always draining a single high-rated niche first.
 */
export async function listProductsMissingReviews(options?: {
  locale?: Locale;
  limit?: number;
  categoryId?: string | null;
  categorySlug?: string | null;
  diversify?: boolean;
}): Promise<MissingReviewProduct[]> {
  const locale = options?.locale ?? "de";
  const limit = Math.min(30, Math.max(1, Number(options?.limit || 5)));
  const diversify = options?.diversify !== false;

  let categoryId = options?.categoryId || null;
  if (!categoryId && options?.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: options.categorySlug },
      select: { id: true },
    });
    categoryId = category?.id ?? null;
  }

  // When scoped to one category, simple top-N is fine.
  if (categoryId || !diversify) {
    const products = await prisma.product.findMany({
      where: {
        ...(categoryId ? { categoryId } : {}),
        articles: {
          none: {
            type: "review",
            locale,
            status: "published",
          },
        },
      },
      orderBy: [
        { rating: "desc" },
        { reviewCount: "desc" },
        { updatedAt: "desc" },
      ],
      take: limit,
      select: {
        id: true,
        asin: true,
        slug: true,
        title: true,
        rating: true,
        reviewCount: true,
        categoryId: true,
        category: { select: { slug: true } },
      },
    });

    return products.map((product) => ({
      id: product.id,
      asin: product.asin,
      slug: product.slug,
      title: product.title,
      rating: product.rating,
      reviewCount: product.reviewCount,
      categoryId: product.categoryId,
      categorySlug: product.category.slug,
    }));
  }

  // Global backfill: pull a pool, then round-robin one product per category.
  const poolSize = Math.min(300, Math.max(limit * 25, 50));
  const pool = await prisma.product.findMany({
    where: {
      articles: {
        none: {
          type: "review",
          locale,
          status: "published",
        },
      },
    },
    orderBy: [
      { rating: "desc" },
      { reviewCount: "desc" },
      { updatedAt: "desc" },
    ],
    take: poolSize,
    select: {
      id: true,
      asin: true,
      slug: true,
      title: true,
      rating: true,
      reviewCount: true,
      categoryId: true,
      category: { select: { slug: true } },
    },
  });

  const queues = new Map<string, MissingReviewProduct[]>();
  for (const product of pool) {
    const mapped: MissingReviewProduct = {
      id: product.id,
      asin: product.asin,
      slug: product.slug,
      title: product.title,
      rating: product.rating,
      reviewCount: product.reviewCount,
      categoryId: product.categoryId,
      categorySlug: product.category.slug,
    };
    const list = queues.get(product.categoryId) || [];
    list.push(mapped);
    queues.set(product.categoryId, list);
  }

  const categoryQueues = [...queues.values()];
  const selected: MissingReviewProduct[] = [];
  let cursor = 0;

  while (selected.length < limit && categoryQueues.some((queue) => queue.length > 0)) {
    const queue = categoryQueues[cursor % categoryQueues.length];
    cursor += 1;
    if (!queue || queue.length === 0) continue;
    selected.push(queue.shift()!);
  }

  return selected;
}

export async function countProductsMissingReviews(options?: {
  locale?: Locale;
  categoryId?: string | null;
}) {
  const locale = options?.locale ?? "de";
  return prisma.product.count({
    where: {
      ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
      articles: {
        none: {
          type: "review",
          locale,
          status: "published",
        },
      },
    },
  });
}

export async function countCategoriesWithReviewBacklog(
  locale: Locale = "de",
): Promise<number> {
  const grouped = await prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      articles: {
        none: {
          type: "review",
          locale,
          status: "published",
        },
      },
    },
    _count: { _all: true },
  });
  return grouped.length;
}

/**
 * Pick the category that currently has the largest review backlog.
 */
export async function resolveCategoryWithReviewBacklog(
  locale: Locale = "de",
): Promise<{ id: string; slug: string; missingCount: number } | null> {
  const grouped = await prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      articles: {
        none: {
          type: "review",
          locale,
          status: "published",
        },
      },
    },
    _count: { _all: true },
  });

  if (grouped.length === 0) return null;

  grouped.sort((a, b) => b._count._all - a._count._all);
  const top = grouped[0];
  const category = await prisma.category.findUnique({
    where: { id: top.categoryId },
    select: { id: true, slug: true },
  });
  if (!category) return null;

  return {
    id: category.id,
    slug: category.slug,
    missingCount: top._count._all,
  };
}
