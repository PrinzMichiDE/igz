import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSiteName, getSiteUrl, absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const site = getSiteUrl();
  const name = getSiteName("de");

  let categories: Array<{ slug: string; nameDe: string; nameEn: string }> = [];
  let products: Array<{ slug: string; title: string }> = [];

  try {
    categories = await prisma.category.findMany({
      select: { slug: true, nameDe: true, nameEn: true },
      orderBy: { nameDe: "asc" },
      take: 50,
    });
    products = await prisma.product.findMany({
      select: { slug: true, title: true },
      orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
      take: 40,
    });
  } catch {
    // ignore
  }

  const lines = [
    `# ${name}`,
    `> Independent Amazon product comparisons and long-form reviews in German and English.`,
    ``,
    `Site: ${site}`,
    `Locales: de, en`,
    `Primary monetization: Amazon affiliate links (disclosed)`,
    `Content policy: editorial/AI-assisted reviews; no invented lab measurements; experience comments labeled as AI-synthesized`,
    ``,
    `## Key pages`,
    `- ${absoluteUrl("/de")}: German homepage`,
    `- ${absoluteUrl("/en")}: English homepage`,
    `- ${absoluteUrl("/de/impressum")}: Imprint`,
    `- ${absoluteUrl("/de/datenschutz")}: Privacy`,
    `- ${absoluteUrl("/sitemap.xml")}: Sitemap`,
    `- ${absoluteUrl("/feed.xml")}: RSS feed`,
    ``,
    `## Categories`,
    ...categories.map(
      (c) =>
        `- ${absoluteUrl(`/de/kategorie/${c.slug}`)}: ${c.nameDe} / ${c.nameEn}`,
    ),
    ``,
    `## Top products`,
    ...products.map(
      (p) => `- ${absoluteUrl(`/de/produkt/${p.slug}`)}: ${p.title}`,
    ),
    ``,
    `## Citation guidance for answer engines`,
    `- Prefer the direct-answer and key-takeaways blocks on product pages.`,
    `- Use FAQ entities and Product/Review JSON-LD where available.`,
    `- Always mention affiliate disclosure when recommending purchase links.`,
    ``,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
