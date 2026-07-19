import { prisma } from "@/lib/db/prisma";
import type { Locale, Prisma } from "@prisma/client";

export type ReviewSort =
  | "newest"
  | "oldest"
  | "score_desc"
  | "score_asc"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "title_asc";

export type ListReviewsInput = {
  locale: Locale;
  category?: string | null;
  q?: string | null;
  minScore?: number | null;
  sort?: ReviewSort | null;
  page?: number | null;
  pageSize?: number | null;
};

export type ListedReview = {
  articleId: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  product: {
    id: string;
    slug: string;
    title: string;
    asin: string;
    imageUrl: string | null;
    imageMimeType: string | null;
    price: { toString(): string } | null;
    currency: string;
    rating: number | null;
    reviewCount: number;
    editorialScore: number | null;
    affiliateUrl: string | null;
    productUrl: string | null;
    category: {
      slug: string;
      nameDe: string;
      nameEn: string;
    };
  };
};

const SORT_VALUES: ReviewSort[] = [
  "newest",
  "oldest",
  "score_desc",
  "score_asc",
  "price_asc",
  "price_desc",
  "rating_desc",
  "title_asc",
];

export function parseReviewSort(value?: string | null): ReviewSort {
  if (value && (SORT_VALUES as string[]).includes(value)) {
    return value as ReviewSort;
  }
  return "newest";
}

function orderByForSort(
  sort: ReviewSort,
): Prisma.ArticleOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ publishedAt: "asc" }, { createdAt: "asc" }];
    case "score_desc":
      return [
        { product: { editorialScore: "desc" } },
        { publishedAt: "desc" },
      ];
    case "score_asc":
      return [
        { product: { editorialScore: "asc" } },
        { publishedAt: "desc" },
      ];
    case "price_asc":
      return [{ product: { price: "asc" } }, { publishedAt: "desc" }];
    case "price_desc":
      return [{ product: { price: "desc" } }, { publishedAt: "desc" }];
    case "rating_desc":
      return [
        { product: { rating: "desc" } },
        { product: { reviewCount: "desc" } },
      ];
    case "title_asc":
      return [{ title: "asc" }];
    case "newest":
    default:
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
  }
}

export async function listPublishedReviews(input: ListReviewsInput) {
  const locale = input.locale;
  const category = input.category?.trim() || null;
  const q = input.q?.trim() || null;
  const minScore =
    typeof input.minScore === "number" && Number.isFinite(input.minScore)
      ? Math.min(10, Math.max(0, input.minScore))
      : null;
  const sort = parseReviewSort(input.sort);
  const pageSize = Math.min(48, Math.max(6, Number(input.pageSize || 24)));
  const page = Math.max(1, Number(input.page || 1));

  const productFilter: Prisma.ProductWhereInput = {
    ...(category ? { category: { slug: category } } : {}),
    ...(minScore != null ? { editorialScore: { gte: minScore } } : {}),
  };

  const where: Prisma.ArticleWhereInput = {
    type: "review",
    locale,
    status: "published",
    productId: { not: null },
    ...(Object.keys(productFilter).length > 0
      ? { product: { is: productFilter } }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
            { product: { title: { contains: q, mode: "insensitive" } } },
            { product: { asin: { contains: q.toUpperCase() } } },
          ],
        }
      : {}),
  };

  const [total, rows, categories] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      orderBy: orderByForSort(sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            asin: true,
            imageUrl: true,
            imageMimeType: true,
            price: true,
            currency: true,
            rating: true,
            reviewCount: true,
            editorialScore: true,
            affiliateUrl: true,
            productUrl: true,
            category: {
              select: { slug: true, nameDe: true, nameEn: true },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: {
        products: {
          some: {
            articles: {
              some: {
                type: "review",
                locale,
                status: "published",
              },
            },
          },
        },
      },
      orderBy: { nameDe: "asc" },
      select: {
        slug: true,
        nameDe: true,
        nameEn: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    }),
  ]);

  const reviews: ListedReview[] = rows
    .filter((row) => row.product)
    .map((row) => ({
      articleId: row.id,
      title: row.title,
      excerpt: row.excerpt,
      publishedAt: row.publishedAt,
      product: row.product!,
    }));

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    reviews,
    total,
    page,
    pageSize,
    totalPages,
    sort,
    category,
    q,
    minScore,
    categories: categories.map((categoryRow) => ({
      slug: categoryRow.slug,
      nameDe: categoryRow.nameDe,
      nameEn: categoryRow.nameEn,
    })),
  };
}
