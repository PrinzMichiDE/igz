import {
  isDetailedSectionedReview,
  type ReviewSection,
} from "@/lib/ai/review-sections";
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
  categorySlugs?: string[] | null;
  diversify?: boolean;
}): Promise<MissingReviewProduct[]> {
  const locale = options?.locale ?? "de";
  const limit = Math.min(30, Math.max(1, Number(options?.limit || 5)));
  const diversify = options?.diversify !== false;
  const categorySlugs = (options?.categorySlugs || [])
    .map((slug) => slug.trim())
    .filter(Boolean);

  let categoryId = options?.categoryId || null;
  if (!categoryId && options?.categorySlug && categorySlugs.length === 0) {
    const category = await prisma.category.findUnique({
      where: { slug: options.categorySlug },
      select: { id: true },
    });
    categoryId = category?.id ?? null;
  }

  const categoryFilter =
    categoryId
      ? { categoryId }
      : categorySlugs.length > 0
        ? { category: { slug: { in: categorySlugs } } }
        : options?.categorySlug
          ? { category: { slug: options.categorySlug } }
          : {};

  // When scoped to one category, simple top-N is fine.
  if ((categoryId || options?.categorySlug) && categorySlugs.length <= 1 && !diversify) {
    const products = await prisma.product.findMany({
      where: {
        ...categoryFilter,
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

  // Global / multi-category backfill: pull a pool, then round-robin per category.
  const poolSize = Math.min(300, Math.max(limit * 25, 50));
  const pool = await prisma.product.findMany({
    where: {
      ...categoryFilter,
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

  // Pass 1: at most one product per category (verschiedene Kategorien).
  for (const queue of categoryQueues) {
    if (selected.length >= limit) break;
    if (queue.length === 0) continue;
    selected.push(queue.shift()!);
  }

  // Pass 2: fill only if fewer categories have backlog than requested slots.
  let cursor = 0;
  while (
    selected.length < limit &&
    categoryQueues.some((queue) => queue.length > 0)
  ) {
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
  categorySlugs?: string[] | null;
}) {
  const locale = options?.locale ?? "de";
  const categorySlugs = (options?.categorySlugs || [])
    .map((slug) => slug.trim())
    .filter(Boolean);
  return prisma.product.count({
    where: {
      ...(options?.categoryId
        ? { categoryId: options.categoryId }
        : categorySlugs.length > 0
          ? { category: { slug: { in: categorySlugs } } }
          : {}),
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
/**
 * Find published reviews that are still in the old short format
 * (fewer than 7 clear sections / too little body text) so we can refresh them.
 */
export async function listProductsNeedingDetailedReviewRefresh(options?: {
  locale?: Locale;
  limit?: number;
  categorySlug?: string | null;
  categorySlugs?: string[] | null;
}): Promise<MissingReviewProduct[]> {
  const locale = options?.locale ?? "de";
  const limit = Math.min(20, Math.max(1, Number(options?.limit || 5)));
  const categorySlugs = (options?.categorySlugs || [])
    .map((slug) => slug.trim())
    .filter(Boolean);

  const articles = await prisma.article.findMany({
    where: {
      type: "review",
      locale,
      status: "published",
      productId: { not: null },
      ...(options?.categorySlug || categorySlugs.length > 0
        ? {
            product: {
              category: {
                slug: options?.categorySlug
                  ? options.categorySlug
                  : { in: categorySlugs },
              },
            },
          }
        : {}),
    },
    orderBy: [{ publishedAt: "asc" }, { updatedAt: "asc" }],
    take: Math.min(250, Math.max(40, limit * 25)),
    select: {
      contentJson: true,
      product: {
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
      },
    },
  });

  const selected: MissingReviewProduct[] = [];
  for (const article of articles) {
    if (!article.product) continue;
    const content = article.contentJson as {
      sections?: ReviewSection[];
    } | null;
    const sections = Array.isArray(content?.sections) ? content.sections : [];
    if (isDetailedSectionedReview(sections)) continue;

    selected.push({
      id: article.product.id,
      asin: article.product.asin,
      slug: article.product.slug,
      title: article.product.title,
      rating: article.product.rating,
      reviewCount: article.product.reviewCount,
      categoryId: article.product.categoryId,
      categorySlug: article.product.category.slug,
    });
    if (selected.length >= limit) break;
  }

  return selected;
}

export async function countProductsNeedingDetailedReviewRefresh(
  locale: Locale = "de",
): Promise<number> {
  const sample = await listProductsNeedingDetailedReviewRefresh({
    locale,
    limit: 20,
  });
  // Cheap signal for ops dashboards — exact global count would scan all articles.
  return sample.length;
}

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
