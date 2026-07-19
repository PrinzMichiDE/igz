import { prisma } from "@/lib/db/prisma";
import {
  BLUETOOTH_HEADPHONES_PAGES,
  type NicheRankingPage,
} from "@/lib/seo/niche/bluetooth-headphones";
import type { Locale } from "@prisma/client";

export type ListedAdviceGuide = {
  source: "article" | "niche";
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  categoryName: string | null;
  hrefPath: string;
};

export async function listPublishedAdviceGuides(input: {
  locale: Locale;
  page?: number | null;
  pageSize?: number | null;
}) {
  const page = Math.max(1, Number(input.page || 1) || 1);
  const pageSize = Math.min(48, Math.max(6, Number(input.pageSize || 18) || 18));
  const isDe = input.locale === "de";

  const [totalArticles, articles] = await Promise.all([
    prisma.article.count({
      where: { type: "advice_guide", locale: input.locale, status: "published" },
    }),
    prisma.article.findMany({
      where: {
        type: "advice_guide",
        locale: input.locale,
        status: "published",
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        category: { select: { nameDe: true, nameEn: true } },
      },
    }),
  ]);

  const articleSlugs = new Set(articles.map((a) => a.slug));
  const listed: ListedAdviceGuide[] = articles.map((article) => ({
    source: "article",
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    publishedAt: article.publishedAt,
    categoryName: article.category
      ? isDe
        ? article.category.nameDe
        : article.category.nameEn
      : null,
    hrefPath: `/ratgeber/${article.slug}`,
  }));

  // On page 1, append static niche guides that are not yet in the DB.
  if (page === 1) {
    const nichePages = BLUETOOTH_HEADPHONES_PAGES.filter(
      (pageItem): pageItem is NicheRankingPage =>
        pageItem.kind !== "pillar" && !articleSlugs.has(pageItem.slug),
    );
    for (const niche of nichePages) {
      listed.push({
        source: "niche",
        slug: niche.slug,
        title: isDe ? niche.h1De : niche.h1En,
        excerpt: isDe ? niche.descriptionDe : niche.descriptionEn,
        publishedAt: null,
        categoryName: isDe ? "Bluetooth-Kopfhörer" : "Bluetooth headphones",
        hrefPath: niche.path,
      });
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalArticles / pageSize));

  return {
    items: listed,
    page,
    pageSize,
    totalArticles,
    totalPages,
  };
}

export async function getPublishedAdviceGuideBySlug(
  locale: Locale,
  slug: string,
) {
  return prisma.article.findFirst({
    where: {
      type: "advice_guide",
      locale,
      status: "published",
      OR: [{ slug }, { topicKey: slug }],
    },
    include: {
      category: {
        select: {
          id: true,
          slug: true,
          nameDe: true,
          nameEn: true,
        },
      },
    },
  });
}
