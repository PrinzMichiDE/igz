import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  openRouterChatStream,
  type ChatMessage,
} from "@/lib/ai/openrouter";
import {
  buildAffiliateUrl,
  buildAmazonStoreAffiliateUrl,
  getPartnerTag,
} from "@/lib/amazon/affiliate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  locale: z.enum(["de", "en"]).default("de"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
  productSlugs: z.array(z.string()).max(4).optional(),
  categorySlug: z.string().optional(),
});

function buildSystemPrompt(input: {
  locale: "de" | "en";
  catalog: string;
  storeUrl: string;
  partnerTag: string;
}) {
  if (input.locale === "en") {
    return `You are a decisive shopping advisor for IGZ Compare.
Your job: ask briefly if needed, then recommend which product the user should buy.

Hard rules:
1) Advise clearly: name a primary pick ("Take this") and 1–2 alternatives.
2) Use ONLY products from the catalog below (with the provided amazonUrl).
3) NEVER invent ASINs or Amazon URLs.
4) ALWAYS end every answer with a section "Amazon links" containing markdown links for:
   - the primary recommendation
   - at least 1–2 alternatives
   - optionally the Amazon store entry link
5) Every product link MUST use the provided amazonUrl exactly (tag=${input.partnerTag}).
6) Keep advice practical (use case, budget, comfort). No fake lab tests.
7) Mention briefly that links are affiliate links.
8) Answer in English.

Amazon store entry link:
${input.storeUrl}

Catalog (use these amazonUrl values verbatim):
${input.catalog}

Required ending format:
## Amazon links
- [Product name](https://www.amazon.de/dp/ASIN?tag=${input.partnerTag}&...)
- [Alternative](https://www.amazon.de/dp/ASIN?tag=${input.partnerTag}&...)
- [More on Amazon](${input.storeUrl})`;
  }

  return `Du bist ein entscheidungsstarker Einkaufsberater für IGZ Vergleich.
Deine Aufgabe: den Nutzer beraten, welches Produkt er nehmen soll.

Harte Regeln:
1) Gib eine klare Empfehlung: 1 Haupt-Tipp („Nimm dieses“) + 1–2 Alternativen.
2) Nutze NUR Produkte aus dem Katalog unten (mit der gelieferten amazonUrl).
3) Erfinde KEINE ASINs und KEINE Amazon-URLs.
4) Beende JEDE Antwort mit dem Abschnitt „Amazon-Links“ und Markdown-Links für:
   - die Hauptempfehlung
   - mindestens 1–2 Alternativen
   - optional den Amazon-Store-Einstieg
5) Jeder Produktlink MUSS exakt die gelieferte amazonUrl verwenden (tag=${input.partnerTag}).
6) Beratung praxisnah (Use-Case, Budget, Komfort). Keine Fake-Labortests.
7) Kurz erwähnen, dass es Affiliate-Links sind.
8) Antworte auf Deutsch.

Amazon-Store-Einstieg:
${input.storeUrl}

Katalog (amazonUrl unverändert verwenden):
${input.catalog}

Pflicht-Abschluss:
## Amazon-Links
- [Produktname](https://www.amazon.de/dp/ASIN?tag=${input.partnerTag}&...)
- [Alternative](https://www.amazon.de/dp/ASIN?tag=${input.partnerTag}&...)
- [Mehr bei Amazon](${input.storeUrl})`;
}

async function loadCatalogContext(options: {
  productSlugs?: string[];
  categorySlug?: string;
}) {
  const parts: string[] = [];
  const seen = new Set<string>();

  if (options.productSlugs?.length) {
    const products = await prisma.product.findMany({
      where: { slug: { in: options.productSlugs } },
      include: { category: true },
      take: 4,
    });
    for (const p of products) {
      seen.add(p.id);
      const amazonUrl = buildAffiliateUrl(p.asin, "DE");
      parts.push(
        `- ${p.title} | slug=${p.slug} | ASIN=${p.asin} | score=${p.editorialScore ?? p.rating ?? "n/a"} | price=${p.price ?? "n/a"} ${p.currency} | category=${p.category.slug} | amazonUrl=${amazonUrl}`,
      );
    }
  }

  const categorySlug = options.categorySlug || "bluetooth-kopfhoerer";
  const top = await prisma.product.findMany({
    where: { category: { slug: categorySlug } },
    orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
    take: 10,
  });

  if (top.length) {
    parts.push("Top products in focus category:");
    for (const p of top) {
      if (seen.has(p.id)) continue;
      const amazonUrl = buildAffiliateUrl(p.asin, "DE");
      parts.push(
        `- ${p.title} | slug=${p.slug} | ASIN=${p.asin} | score=${p.editorialScore ?? p.rating ?? "n/a"} | price=${p.price ?? "n/a"} ${p.currency} | amazonUrl=${amazonUrl}`,
      );
    }
  }

  return parts.join("\n") || "No catalog products available.";
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);

    const lastUser = [...body.messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUser) {
      return NextResponse.json({ error: "Missing user message" }, { status: 400 });
    }

    const catalog = await loadCatalogContext({
      productSlugs: body.productSlugs,
      categorySlug: body.categorySlug,
    }).catch(() => "Catalog temporarily unavailable.");

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: buildSystemPrompt({
          locale: body.locale,
          catalog,
          storeUrl: buildAmazonStoreAffiliateUrl(),
          partnerTag: getPartnerTag("DE"),
        }),
      },
      ...body.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const upstream = await openRouterChatStream({
      messages,
      temperature: 0.35,
    });

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Chat failed";
    const status = message.includes("OPENROUTER_API_KEY") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
