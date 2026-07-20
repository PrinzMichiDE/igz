import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { BLUETOOTH_HEADPHONES_PAGES } from "@/lib/seo/niche/bluetooth-headphones";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://igz.example.com";

  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string; updatedAt: Date }> = [];
  let adviceGuides: Array<{
    slug: string;
    updatedAt: Date;
    locale: "de" | "en";
  }> = [];
  let gameReviews: Array<{
    slug: string;
    updatedAt: Date;
    locale: "de" | "en";
    gameSlug: string;
  }> = [];
  try {
    [products, categories, adviceGuides, gameReviews] = await Promise.all([
      prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.article.findMany({
        where: { type: "advice_guide", status: "published" },
        select: { slug: true, updatedAt: true, locale: true },
      }),
      prisma.gameReview
        .findMany({
          where: { status: "published" },
          select: {
            slug: true,
            updatedAt: true,
            locale: true,
            game: { select: { slug: true } },
          },
        })
        .then((rows) =>
          rows.map((row) => ({
            slug: row.slug,
            updatedAt: row.updatedAt,
            locale: row.locale,
            gameSlug: row.game.slug,
          })),
        ),
    ]);
  } catch {
    // Build/preview without a reachable DB should still emit static routes.
    products = [];
    categories = [];
    adviceGuides = [];
    gameReviews = [];
  }

  const locales = ["de", "en"] as const;
  const staticPaths = [
    "",
    "/kategorien",
    "/bestenlisten",
    "/reviews",
    "/spiele",
    "/ratgeber",
    "/deals",
    "/suche",
    "/vergleich",
    "/scanner",
    "/methodik",
    "/ueber-uns",
    "/redaktionelle-richtlinien",
    "/kontakt",
    "/impressum",
    "/datenschutz",
  ];

  const entries: MetadataRoute.Sitemap = [];
  const articleSlugsByLocale = {
    de: new Set(
      adviceGuides.filter((g) => g.locale === "de").map((g) => g.slug),
    ),
    en: new Set(
      adviceGuides.filter((g) => g.locale === "en").map((g) => g.slug),
    ),
  };

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency:
          path === "" || path === "/ratgeber" || path === "/spiele"
            ? "daily"
            : "weekly",
        priority:
          path === ""
            ? 1
            : path === "/ratgeber" || path === "/spiele"
              ? 0.85
              : 0.7,
      });
    }

    for (const category of categories) {
      entries.push({
        url: `${baseUrl}/${locale}/kategorie/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: "daily",
        priority: 0.9,
      });
      entries.push({
        url: `${baseUrl}/${locale}/kategorie/${category.slug}/kaufberatung`,
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    for (const product of products) {
      entries.push({
        url: `${baseUrl}/${locale}/produkt/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const guide of adviceGuides.filter((g) => g.locale === locale)) {
      entries.push({
        url: `${baseUrl}/${locale}/ratgeber/${guide.slug}`,
        lastModified: guide.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const gameReview of gameReviews.filter((g) => g.locale === locale)) {
      entries.push({
        url: `${baseUrl}/${locale}/spiele/${gameReview.gameSlug}`,
        lastModified: gameReview.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const niche of BLUETOOTH_HEADPHONES_PAGES) {
      if (niche.kind === "pillar") continue;
      if (articleSlugsByLocale[locale].has(niche.slug)) continue;
      entries.push({
        url: `${baseUrl}/${locale}${niche.path}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  }

  return entries;
}
