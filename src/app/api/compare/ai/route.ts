import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { openRouterChatJson } from "@/lib/ai/openrouter";
import { buildComparePairSlug } from "@/lib/compare/pair";
import { enforceIpRateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  locale: z.enum(["de", "en"]).default("de"),
  slugA: z.string().min(1),
  slugB: z.string().min(1),
});

type AiCompareResult = {
  winnerSlug: string | "tie";
  summary: string;
  forA: string[];
  forB: string[];
  bottomLine: string;
};

export async function POST(req: NextRequest) {
  const limited = await enforceIpRateLimit(req, {
    bucket: "compare-ai",
    limit: 30,
    windowSeconds: 60 * 60,
  });
  if (limited) return limited;

  try {
    const body = schema.parse(await req.json());
    const pair = buildComparePairSlug(body.slugA, body.slugB);

    const products = await prisma.product.findMany({
      where: { slug: { in: [body.slugA, body.slugB] } },
    });

    if (products.length !== 2) {
      return NextResponse.json({ error: "Products not found" }, { status: 404 });
    }

    const [a, b] =
      products[0].slug === body.slugA
        ? [products[0], products[1]]
        : products[0].slug === body.slugB
          ? [products[1], products[0]]
          : [products[0], products[1]];

    const prompt =
      body.locale === "en"
        ? `Compare these two products head-to-head and return JSON.
A: ${a.title} (slug=${a.slug}, score=${a.editorialScore ?? a.rating}, price=${a.price} ${a.currency}, rating=${a.rating}, reviews=${a.reviewCount})
B: ${b.title} (slug=${b.slug}, score=${b.editorialScore ?? b.rating}, price=${b.price} ${b.currency}, rating=${b.rating}, reviews=${b.reviewCount})
Schema: {"winnerSlug":"slug-or-tie","summary":"string","forA":["..."],"forB":["..."],"bottomLine":"string"}`
        : `Vergleiche diese zwei Produkte direkt und antworte als JSON.
A: ${a.title} (slug=${a.slug}, score=${a.editorialScore ?? a.rating}, price=${a.price} ${a.currency}, rating=${a.rating}, reviews=${a.reviewCount})
B: ${b.title} (slug=${b.slug}, score=${b.editorialScore ?? b.rating}, price=${b.price} ${b.currency}, rating=${b.rating}, reviews=${b.reviewCount})
Schema: {"winnerSlug":"slug-or-tie","summary":"string","forA":["..."],"forB":["..."],"bottomLine":"string"}`;

    const result = await openRouterChatJson<AiCompareResult>({
      messages: [
        {
          role: "system",
          content:
            body.locale === "en"
              ? "You are an honest product comparison editor. No invented lab tests. JSON only."
              : "Du bist ein ehrlicher Produktvergleichs-Redakteur. Keine erfundenen Labortests. Nur JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.35,
    });

    return NextResponse.json({
      pair,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Compare AI failed";
    const status = message.includes("OPENROUTER_API_KEY") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
