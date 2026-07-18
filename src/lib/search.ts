import { prisma } from "@/lib/db/prisma";
import type { AppLocale } from "@/i18n/routing";

export type SearchResultProduct = {
  id: string;
  asin: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  price: string | null;
  currency: string;
  score: number | null;
  categorySlug: string;
  categoryName: string;
  affiliateUrl: string | null;
  productUrl: string | null;
};

export type SearchResultCategory = {
  slug: string;
  name: string;
  productCount: number;
};

export type SiteSearchResults = {
  query: string;
  products: SearchResultProduct[];
  categories: SearchResultCategory[];
};

export async function searchSite(
  query: string,
  locale: AppLocale,
): Promise<SiteSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: trimmed, products: [], categories: [] };
  }

  const [products, categories] = await Promise.all([
    prisma.product
      .findMany({
        where: {
          OR: [
            { title: { contains: trimmed, mode: "insensitive" } },
            { asin: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        include: {
          category: true,
          articles: {
            where: { type: "review", locale, status: "published" },
            take: 1,
          },
        },
        orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
        take: 24,
      })
      .catch(() => []),
    prisma.category
      .findMany({
        where: {
          OR: [
            { nameDe: { contains: trimmed, mode: "insensitive" } },
            { nameEn: { contains: trimmed, mode: "insensitive" } },
            { slug: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        include: { _count: { select: { products: true } } },
        take: 8,
      })
      .catch(() => []),
  ]);

  return {
    query: trimmed,
    products: products.map((product) => ({
      id: product.id,
      asin: product.asin,
      slug: product.slug,
      title: product.articles[0]?.title || product.title,
      imageUrl: product.imageUrl,
      price: product.price?.toString() ?? null,
      currency: product.currency,
      score: product.editorialScore ?? product.rating,
      categorySlug: product.category.slug,
      categoryName:
        locale === "en" ? product.category.nameEn : product.category.nameDe,
      affiliateUrl: product.affiliateUrl,
      productUrl: product.productUrl,
    })),
    categories: categories.map((category) => ({
      slug: category.slug,
      name: locale === "en" ? category.nameEn : category.nameDe,
      productCount: category._count.products,
    })),
  };
}
