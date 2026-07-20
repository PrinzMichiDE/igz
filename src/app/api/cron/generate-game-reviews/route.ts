import { NextRequest, NextResponse } from "next/server";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";
import { generateAndPublishGameReview } from "@/lib/games/generate-review";
import {
  DAILY_NEW_GAME_REVIEW_TARGET,
  remainingDailyGameReviewSlots,
} from "@/lib/games/daily-quota";
import { pickGamesForDailyReviews, upsertGameFromIgdb } from "@/lib/games/upsert";
import { igdbConfigured } from "@/lib/igdb/client";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily IGDB game reviews: up to 10 new published reviews (UTC), no duplicates.
 * Admin/manual: ?igdbId=1942&force=1
 */
export async function GET(req: NextRequest) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;

  if (!igdbConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "IGDB_CLIENT_ID / IGDB_CLIENT_SECRET not configured",
      },
      { status: 503 },
    );
  }

  const locales = (req.nextUrl.searchParams.get("locales") || "de")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const force = req.nextUrl.searchParams.get("force") === "1";
  const igdbIdParam = req.nextUrl.searchParams.get("igdbId");
  const countParam = Number(req.nextUrl.searchParams.get("count") || "");
  const count = Number.isFinite(countParam) && countParam > 0
    ? Math.min(countParam, 10)
    : DAILY_NEW_GAME_REVIEW_TARGET;
  const primaryLocale = locales[0] ?? "de";
  const bypassDailyQuota = force || Boolean(igdbIdParam);

  try {
    const slots = await remainingDailyGameReviewSlots({
      bypass: bypassDailyQuota,
      target: count,
    });
    if (!bypassDailyQuota && slots <= 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "daily_game_review_quota_reached",
        target: DAILY_NEW_GAME_REVIEW_TARGET,
      });
    }

    return enqueueOrRunInline(
      {
        lockKey: "cron:generate-game-reviews",
        workflowPath: "/api/workflows/generate-game-reviews",
        lockTtlSeconds: 55 * 60,
        force,
        body: {
          locales,
          count: bypassDailyQuota ? count : Math.min(count, slots),
          igdbId: igdbIdParam ? Number(igdbIdParam) : null,
          lockKey: "cron:generate-game-reviews",
          force,
          respectDailyQuota: !bypassDailyQuota,
        },
      },
      async () => {
        const created = [];
        const target = bypassDailyQuota ? count : Math.min(count, slots);

        if (igdbIdParam) {
          const igdbId = Number(igdbIdParam);
          if (!Number.isFinite(igdbId) || igdbId <= 0) {
            throw new Error("Invalid igdbId");
          }
          const { upsertGameByIgdbId } = await import("@/lib/games/upsert");
          const game = await withDbRetry(() => upsertGameByIgdbId(igdbId));
          for (const locale of locales.length ? locales : (["de"] as Locale[])) {
            const review = await generateAndPublishGameReview({ game, locale });
            created.push({
              igdbId,
              gameSlug: game.slug,
              reviewSlug: review.slug,
              locale: review.locale,
              score: review.overallScore,
            });
          }
          return { created, target: 1 };
        }

        const picks = await withDbRetry(() =>
          pickGamesForDailyReviews({
            locale: primaryLocale,
            count: target,
          }),
        );

        for (const pick of picks) {
          if (!bypassDailyQuota) {
            const left = await remainingDailyGameReviewSlots({ target: count });
            if (left <= 0) break;
          }
          const game = await withDbRetry(() => upsertGameFromIgdb(pick));
          for (const locale of locales.length ? locales : (["de"] as Locale[])) {
            const review = await generateAndPublishGameReview({ game, locale });
            created.push({
              igdbId: game.igdbId,
              gameSlug: game.slug,
              reviewSlug: review.slug,
              locale: review.locale,
              score: review.overallScore,
            });
          }
        }

        return {
          created,
          target: DAILY_NEW_GAME_REVIEW_TARGET,
          picked: picks.length,
        };
      },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
