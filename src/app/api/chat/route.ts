import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  openRouterChatStream,
  type ChatMessage,
} from "@/lib/ai/openrouter";

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
}) {
  if (input.locale === "en") {
    return `You are the shopping assistant for IGZ Compare.
Help users choose Amazon products using the catalog context below.
Rules:
- Be concise, practical and honest.
- Never invent lab tests or fake certifications.
- Mention when affiliate links may be used.
- If unsure, ask a clarifying question about use case (commute, sport, office, budget).
- Prefer recommendations from the provided catalog.
- Answer in English.

Catalog context:
${input.catalog}`;
  }

  return `Du bist der Einkaufsassistent von IGZ Vergleich.
Hilf Nutzern bei der Auswahl von Amazon-Produkten anhand des Katalog-Kontexts.
Regeln:
- Antworte knapp, praxisnah und ehrlich auf Deutsch.
- Erfinde keine Labortests oder Zertifikate.
- Erwähne bei Kaufempfehlungen den Affiliate-Hinweis.
- Bei Unklarheit nach Nutzungsszenario fragen (Pendeln, Sport, Büro, Budget).
- Bevorzuge Produkte aus dem bereitgestellten Katalog.

Katalog-Kontext:
${input.catalog}`;
}

async function loadCatalogContext(options: {
  productSlugs?: string[];
  categorySlug?: string;
}) {
  const parts: string[] = [];

  if (options.productSlugs?.length) {
    const products = await prisma.product.findMany({
      where: { slug: { in: options.productSlugs } },
      include: { category: true },
      take: 4,
    });
    for (const p of products) {
      parts.push(
        `- ${p.title} | slug=${p.slug} | ASIN=${p.asin} | score=${p.editorialScore ?? p.rating ?? "n/a"} | price=${p.price ?? "n/a"} ${p.currency} | category=${p.category.slug}`,
      );
    }
  }

  const categorySlug = options.categorySlug || "bluetooth-kopfhoerer";
  const top = await prisma.product.findMany({
    where: { category: { slug: categorySlug } },
    orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
    take: 8,
  });

  if (top.length) {
    parts.push("Top products in focus category:");
    for (const p of top) {
      parts.push(
        `- ${p.title} | slug=${p.slug} | score=${p.editorialScore ?? p.rating ?? "n/a"} | price=${p.price ?? "n/a"} ${p.currency}`,
      );
    }
  }

  return parts.join("\n") || "No catalog products available.";
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);

    const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
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
        content: buildSystemPrompt({ locale: body.locale, catalog }),
      },
      ...body.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const upstream = await openRouterChatStream({
      messages,
      temperature: 0.4,
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
