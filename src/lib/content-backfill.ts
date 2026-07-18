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
 * Prefer higher Amazon rating / review volume so the best pages go live first.
 */
export async function listProductsMissingReviews(options?: {
  locale?: Locale;
  limit?: number;
  categoryId?: string | null;
  categorySlug?: string | null;
}): Promise<MissingReviewProduct[]> {
  const locale = options?.locale ?? "de";
  const limit = Math.min(20, Math.max(1, Number(options?.limit || 3)));

  let categoryId = options?.categoryId || null;
  if (!categoryId && options?.categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: options.categorySlug },
      select: { id: true },
    });
    categoryId = category?.id ?? null;
  }

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
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }, { updatedAt: "desc" }],
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

/**
 * Pick the category that currently has the largest review backlog.
 * Used when a cron run wants category-scoped side effects (guides/manuals)
 * but should still prioritize unfinished work.
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
