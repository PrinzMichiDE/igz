import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { routing } from "@/i18n/routing";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/bestenlisten",
    "/methodik",
    "/ueber-uns",
    "/impressum",
    "/datenschutz",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      const priority =
        path === ""
          ? 1
          : path === "/bestenlisten"
            ? 0.9
            : path === "/methodik" || path === "/ueber-uns"
              ? 0.6
              : 0.3;

      entries.push({
        url: absoluteUrl(localizedPath(locale, path)),
        lastModified: new Date(),
        changeFrequency: path === "" || path === "/bestenlisten" ? "daily" : "weekly",
        priority,
      });
    }
  }

  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const locale of routing.locales) {
      for (const category of categories) {
        entries.push({
          url: absoluteUrl(localizedPath(locale, `/kategorie/${category.slug}`)),
          lastModified: category.updatedAt,
          changeFrequency: "daily",
          priority: 0.85,
        });
      }
      for (const product of products) {
        entries.push({
          url: absoluteUrl(localizedPath(locale, `/produkt/${product.slug}`)),
          lastModified: product.updatedAt,
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
    }
  } catch {
    // DB unavailable during build/runtime without credentials
  }

  return entries;
}
