import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://igz.example.com";

  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let categories: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({ select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    ]);
  } catch {
    // Build/preview without a reachable DB should still emit static routes.
    products = [];
    categories = [];
  }

  const locales = ["de", "en"] as const;
  const staticPaths = [
    "",
    "/kategorien",
    "/bestenlisten",
    "/reviews",
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

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${baseUrl}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
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
  }

  return entries;
}
