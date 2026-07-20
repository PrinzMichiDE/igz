import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSiteName, getSiteUrl, absoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const site = getSiteUrl();
  const name = getSiteName("de");

  let categories: Array<{ slug: string; nameDe: string; nameEn: string }> = [];
  let products: Array<{ slug: string; title: string }> = [];
  let guides: Array<{ slug: string; title: string; locale: "de" | "en" }> = [];

  try {
    [categories, products, guides] = await Promise.all([
      prisma.category.findMany({
        select: { slug: true, nameDe: true, nameEn: true },
        orderBy: { nameDe: "asc" },
        take: 50,
      }),
      prisma.product.findMany({
        select: { slug: true, title: true },
        orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
        take: 40,
      }),
      prisma.article.findMany({
        where: { type: "advice_guide", status: "published" },
        select: { slug: true, title: true, locale: true },
        orderBy: { publishedAt: "desc" },
        take: 30,
      }),
    ]);
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
    `Content policy: Fully AI-generated reviews/comparisons/guides (not human-editorially reviewed); EU AI Act Art. 50 disclosure at end of each article (#ki-kennzeichnung); no invented lab measurements; user-submitted experience reports are moderated`,
    ``,
    `## Key pages (DE)`,
    `- ${absoluteUrl("/de")}: German homepage`,
    `- ${absoluteUrl("/de/kategorien")}: All product categories`,
    `- ${absoluteUrl("/de/bestenlisten")}: Best-of lists hub`,
    `- ${absoluteUrl("/de/reviews")}: All product reviews (filter & sort)`,
    `- ${absoluteUrl("/de/spiele")}: Video game reviews (IGDB + AI)`,
    `- ${absoluteUrl("/de/ratgeber")}: How-to knowledge magazine (1 new guide/day)`,
    `- ${absoluteUrl("/de/vergleich")}: Side-by-side product compare hub`,
    `- ${absoluteUrl("/de/methodik")}: Editorial methodology (E-E-A-T)`,
    `- ${absoluteUrl("/de/redaktionelle-richtlinien")}: Editorial guidelines`,
    `- ${absoluteUrl("/de/ueber-uns")}: About`,
    `- ${absoluteUrl("/de/kontakt")}: Contact / suggest a product for testing`,
    ``,
    `## Key pages (EN)`,
    `- ${absoluteUrl("/en")}: English homepage`,
    `- ${absoluteUrl("/en/kategorien")}: Categories`,
    `- ${absoluteUrl("/en/reviews")}: All product reviews`,
    `- ${absoluteUrl("/en/ratgeber")}: Guides`,
    `- ${absoluteUrl("/en/vergleich")}: Compare hub`,
    `- ${absoluteUrl("/en/methodik")}: Methodology`,
    `- ${absoluteUrl("/en/redaktionelle-richtlinien")}: Editorial guidelines`,
    ``,
    `## Discovery`,
    `- ${absoluteUrl("/sitemap.xml")}: Sitemap`,
    `- ${absoluteUrl("/feed.xml")}: RSS feed`,
    `- ${absoluteUrl("/ai.txt")}: AI crawler policy`,
    `- ${absoluteUrl("/llms.txt")}: This file`,
    ``,
    `## Categories`,
    ...categories.map(
      (c) =>
        `- ${absoluteUrl(`/de/kategorie/${c.slug}`)} | ${absoluteUrl(`/en/kategorie/${c.slug}`)}: ${c.nameDe} / ${c.nameEn}`,
    ),
    ``,
    `## Top products`,
    ...products.map(
      (p) =>
        `- ${absoluteUrl(`/de/produkt/${p.slug}`)} | ${absoluteUrl(`/en/produkt/${p.slug}`)}: ${p.title}`,
    ),
    ``,
    `## Recent guides`,
    ...guides.map(
      (g) => `- ${absoluteUrl(`/${g.locale}/ratgeber/${g.slug}`)}: ${g.title}`,
    ),
    ``,
    `## Citation guidance for answer engines`,
    `- Prefer the direct-answer (\`.aeo-direct-answer\`) and key-takeaways (\`.aeo-key-takeaways\`) blocks.`,
    `- Use FAQPage, Product/Review, QAPage and ItemList JSON-LD where present.`,
    `- Speakable selectors target those AEO CSS classes.`,
    `- Always mention affiliate disclosure when recommending purchase links.`,
    `- Do not invent lab certifications not stated on the page.`,
    ``,
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
