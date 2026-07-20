import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/admin";
import { generateAndPublishGameReview } from "@/lib/games/generate-review";
import { upsertGameByIgdbId } from "@/lib/games/upsert";
import { igdbConfigured } from "@/lib/igdb/client";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  igdbId: z.coerce.number().int().positive(),
  locales: z
    .array(z.enum(["de", "en"]))
    .min(1)
    .max(2)
    .default(["de"]),
});

export async function POST(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!igdbConfigured()) {
    return NextResponse.json(
      { error: "IGDB_CLIENT_ID / IGDB_CLIENT_SECRET not configured" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const game = await upsertGameByIgdbId(parsed.data.igdbId);
    const created = [];
    for (const locale of parsed.data.locales as Locale[]) {
      const review = await generateAndPublishGameReview({ game, locale });
      created.push({
        id: review.id,
        slug: review.slug,
        locale: review.locale,
        title: review.title,
        score: review.overallScore,
        path: `/${locale}/spiele/${game.slug}`,
      });
    }
    return NextResponse.json({
      ok: true,
      game: {
        id: game.id,
        igdbId: game.igdbId,
        slug: game.slug,
        name: game.name,
        coverUrl: game.coverUrl,
      },
      reviews: created,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Generation failed",
      },
      { status: 500 },
    );
  }
}
