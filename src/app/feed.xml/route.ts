import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { absoluteUrl, getSiteName, getSiteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const site = getSiteUrl();
  const title = getSiteName("de");

  let articles: Array<{
    title: string;
    slug: string;
    excerpt: string | null;
    locale: "de" | "en";
    updatedAt: Date;
    product: { slug: string } | null;
    category: { slug: string } | null;
    type: string;
  }> = [];

  try {
    articles = await prisma.article.findMany({
      where: { status: "published" },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        title: true,
        slug: true,
        excerpt: true,
        locale: true,
        updatedAt: true,
        type: true,
        product: { select: { slug: true } },
        category: { select: { slug: true } },
      },
    });
  } catch {
    // ignore
  }

  const items = articles
    .map((article) => {
      const path =
        article.type === "comparison" && article.category
          ? `/${article.locale}/kategorie/${article.category.slug}`
          : article.product
            ? `/${article.locale}/produkt/${article.product.slug}`
            : `/${article.locale}`;
      const link = absoluteUrl(path);
      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escapeXml(article.excerpt || article.title)}</description>
      <pubDate>${article.updatedAt.toUTCString()}</pubDate>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${site}</link>
    <description>Amazon product comparisons and reviews</description>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
