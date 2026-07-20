import { NextRequest, NextResponse } from "next/server";
import { generateAdviceGuide } from "@/lib/ai/generate";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";
import {
  DAILY_NEW_ADVICE_GUIDE_TARGET,
  remainingDailyAdviceGuideSlots,
} from "@/lib/ratgeber/daily-quota";
import {
  countRemainingAdviceGuideTopics,
  pickNextAdviceGuideTopic,
} from "@/lib/ratgeber/select-topic";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily Ratgeber pipeline: publish 1 new how-to / knowledge article (UTC).
 * Topics are care, cleaning, setup — not classic buying guides.
 * Default locale: de. Opt-in English with ?locales=de,en
 */
export async function GET(req: NextRequest) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;

  const locales = (req.nextUrl.searchParams.get("locales") || "de")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const force = req.nextUrl.searchParams.get("force") === "1";
  const topicKey = req.nextUrl.searchParams.get("topic");
  const primaryLocale = locales[0] ?? "de";
  const bypassDailyQuota = force || Boolean(topicKey);

  try {
    const slots = await remainingDailyAdviceGuideSlots({
      bypass: bypassDailyQuota,
    });
    if (!bypassDailyQuota && slots <= 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "daily_advice_guide_quota_reached",
        target: DAILY_NEW_ADVICE_GUIDE_TARGET,
      });
    }

    const nextTopic = topicKey
      ? { topicKey }
      : await withDbRetry(() => pickNextAdviceGuideTopic(primaryLocale));

    if (!nextTopic) {
      const remaining = await countRemainingAdviceGuideTopics(primaryLocale);
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "no_unused_topics",
        remainingTopics: remaining,
      });
    }

    return enqueueOrRunInline(
      {
        lockKey: "cron:generate-ratgeber",
        workflowPath: "/api/workflows/generate-ratgeber",
        lockTtlSeconds: 25 * 60,
        force,
        body: {
          locales,
          topicKey: topicKey || nextTopic.topicKey,
          lockKey: "cron:generate-ratgeber",
          force,
          respectDailyQuota: !bypassDailyQuota,
        },
      },
      async () => {
        const created = [];
        for (const locale of locales.length ? locales : (["de"] as Locale[])) {
          if (!bypassDailyQuota) {
            const left = await remainingDailyAdviceGuideSlots();
            if (left <= 0) break;
          }
          const article = await generateAdviceGuide({
            locale,
            topicKey: topicKey || nextTopic.topicKey,
          });
          created.push({
            id: article.id,
            slug: article.slug,
            locale: article.locale,
            title: article.title,
          });
        }
        return {
          created,
          target: DAILY_NEW_ADVICE_GUIDE_TARGET,
        };
      },
    );
  } catch (error) {
    const message = formatDatabaseError(error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
