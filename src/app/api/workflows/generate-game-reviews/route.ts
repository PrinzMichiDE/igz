import { serve } from "@upstash/workflow/nextjs";
import { generateAndPublishGameReview } from "@/lib/games/generate-review";
import {
  DAILY_NEW_GAME_REVIEW_TARGET,
  remainingDailyGameReviewSlots,
} from "@/lib/games/daily-quota";
import {
  pickGamesForDailyReviews,
  upsertGameByIgdbId,
  upsertGameFromIgdb,
} from "@/lib/games/upsert";
import { releaseLock } from "@/lib/upstash/redis";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Payload = {
  locales?: Locale[];
  count?: number;
  igdbId?: number | null;
  lockKey?: string;
  force?: boolean;
  respectDailyQuota?: boolean;
};

export const { POST } = serve<Payload>(async (context) => {
  const payload = await context.run("get-payload", () => context.requestPayload || {});
  const lockKey = payload.lockKey || "cron:generate-game-reviews";
  const locales = (
    payload.locales?.length ? payload.locales : (["de"] as Locale[])
  ).filter((v): v is Locale => v === "de" || v === "en");
  const primaryLocale = locales[0] ?? "de";
  const respectDailyQuota =
    payload.respectDailyQuota === true && payload.force !== true;
  const requested = Math.min(
    Math.max(payload.count || DAILY_NEW_GAME_REVIEW_TARGET, 1),
    10,
  );

  try {
    const quota = await context.run("daily-game-quota", async () => {
      if (!respectDailyQuota) {
        return { remaining: requested, bypassed: true };
      }
      const remaining = await remainingDailyGameReviewSlots({
        target: DAILY_NEW_GAME_REVIEW_TARGET,
      });
      return { remaining, bypassed: false };
    });

    if (quota.remaining <= 0) {
      await context.run("release-lock-quota", async () => {
        await releaseLock(lockKey);
      });
      return { ok: true, skipped: true, reason: "quota" };
    }

    const target = Math.min(requested, quota.remaining);
    const created: Array<Record<string, unknown>> = [];

    if (payload.igdbId) {
      const game = await context.run(`upsert-igdb-${payload.igdbId}`, async () =>
        upsertGameByIgdbId(Number(payload.igdbId)),
      );
      for (const locale of locales) {
        const review = await context.run(
          `review-${game.igdbId}-${locale}`,
          async () => generateAndPublishGameReview({ game, locale }),
        );
        created.push({
          igdbId: game.igdbId,
          gameSlug: game.slug,
          reviewSlug: review.slug,
          locale,
        });
      }
    } else {
      const picks = await context.run("pick-games", async () =>
        pickGamesForDailyReviews({ locale: primaryLocale, count: target }),
      );

      for (const [index, pick] of picks.entries()) {
        if (created.length >= target) break;
        const game = await context.run(`upsert-${pick.id}-${index}`, async () =>
          upsertGameFromIgdb(pick),
        );
        for (const locale of locales) {
          const review = await context.run(
            `review-${game.igdbId}-${locale}-${index}`,
            async () => generateAndPublishGameReview({ game, locale }),
          );
          created.push({
            igdbId: game.igdbId,
            gameSlug: game.slug,
            reviewSlug: review.slug,
            locale,
          });
        }
      }
    }

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
    });

    return { ok: true, created, target };
  } catch (error) {
    await context.run("release-lock-error", async () => {
      await releaseLock(lockKey);
    });
    throw error;
  }
});
