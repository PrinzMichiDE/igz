import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { routing } from "@/i18n/routing";
import { BLUETOOTH_HEADPHONES_PAGES } from "@/lib/seo/niche/bluetooth-headphones";
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

    for (const page of BLUETOOTH_HEADPHONES_PAGES) {
      if (page.kind === "pillar") continue;
      entries.push({
        url: absoluteUrl(localizedPath(locale, page.path)),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.82,
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
