import { NextRequest, NextResponse } from "next/server";
import { ensureTopAmazonCategories } from "@/lib/amazon/sync-categories";
import { syncCategorySearch } from "@/lib/amazon/sync";
import { QuotaExceededError } from "@/lib/amazon/quota";
import {
  countProductsMissingReviews,
  listProductsMissingReviews,
} from "@/lib/content-backfill";
import { prisma } from "@/lib/db/prisma";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";
import {
  ENTERTAINMENT_CATEGORY_SLUGS,
  entertainmentSyncSlugForToday,
} from "@/lib/entertainment";
import { remainingDailyReviewSlots } from "@/lib/review-daily-quota";
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily entertainment pipeline:
 * 1) Ensure Filme / Serien / Videospiele categories exist
 * 2) Sync one rotating entertainment category (saves RapidAPI quota)
 * 3) Optionally enqueue reviews — default is sync-only so the global
 *    budget of 3 diversified Amazon tests/day stays intact.
 *
 * Opt-in reviews: `?reviews=1` (uses remaining daily slots) or `?products=N`.
 */
export async function GET(req: NextRequest) {
  const locales = (req.nextUrl.searchParams.get("locales") || "de")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const force = req.nextUrl.searchParams.get("force") === "1";
  const skipSync = req.nextUrl.searchParams.get("skipSync") === "1";
  const reviewsParam = req.nextUrl.searchParams.get("reviews");
  const productsParam = req.nextUrl.searchParams.get("products");
  const wantReviews =
    reviewsParam === "1" ||
    (productsParam != null &&
      productsParam !== "" &&
      Number(productsParam) > 0);
  const primaryLocale = locales[0] ?? "de";
  const syncSlug =
    req.nextUrl.searchParams.get("syncCategory") ||
    entertainmentSyncSlugForToday();

  try {
    const prep = await withDbRetry(async () => {
      await ensureTopAmazonCategories({
        limit: 80,
        fetchFromApi: false,
      });

      const categories = await prisma.category.findMany({
        where: { slug: { in: [...ENTERTAINMENT_CATEGORY_SLUGS] } },
        select: { id: true, slug: true },
      });

      if (categories.length === 0) {
        throw new Error(
          "Entertainment categories missing after ensureTopAmazonCategories",
        );
      }

      let syncResult: {
        slug: string;
        upserted?: number;
        skipped: boolean;
        error?: string;
      } = { slug: syncSlug, skipped: true };

      if (!skipSync) {
        const syncCategory = categories.find((c) => c.slug === syncSlug);
        if (syncCategory) {
          try {
            const search = await syncCategorySearch(syncCategory.id);
            syncResult = {
              slug: syncSlug,
              upserted: search.upserted,
              skipped: false,
            };
          } catch (error) {
            if (error instanceof QuotaExceededError) {
              syncResult = {
                slug: syncSlug,
                skipped: true,
                error: "quota_exceeded",
              };
            } else {
              throw error;
            }
          }
        }
      }

      const backlog = await countProductsMissingReviews({
        locale: primaryLocale,
        categorySlugs: [...ENTERTAINMENT_CATEGORY_SLUGS],
      });

      const preview = await listProductsMissingReviews({
        locale: primaryLocale,
        limit: 3,
        categorySlugs: [...ENTERTAINMENT_CATEGORY_SLUGS],
        diversify: true,
      });

      return {
        categories: categories.map((c) => c.slug),
        syncResult,
        backlog,
        previewAsins: preview.map((p) => p.asin),
      };
    });

    if (!wantReviews) {
      return NextResponse.json({
        ok: true,
        mode: "sync-only",
        message:
          "Entertainment catalog synced; reviews come from the daily 3-test budget",
        entertainmentPrep: prep,
        targetReviews: 0,
      });
    }

    const remaining = await remainingDailyReviewSlots({ bypass: force });
    const productLimit = Math.min(
      remaining,
      Math.max(1, Number(productsParam || remaining || 1)),
      3,
    );

    if (productLimit <= 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "daily_review_quota_reached",
        entertainmentPrep: prep,
        targetReviews: 0,
      });
    }

    if (prep.backlog === 0) {
      return NextResponse.json({
        ok: true,
        mode: "idle",
        message: "No entertainment products waiting for reviews",
        entertainmentPrep: prep,
        targetReviews: productLimit,
      });
    }

    const queued = await enqueueOrRunInline(
      {
        lockKey: "cron:generate-entertainment",
        workflowPath: "/api/workflows/generate-content",
        lockTtlSeconds: 55 * 60,
        force,
        body: {
          category: null,
          categorySlugs: [...ENTERTAINMENT_CATEGORY_SLUGS],
          locales,
          comments: 2,
          productLimit,
          skipGuides: true,
          forceTech: false,
          force: false,
          refreshShort: false,
          backfillMissing: true,
          diversify: true,
          respectDailyQuota: !force,
          chainRemaining: 0,
          fromCron: true,
          lockKey: "cron:generate-entertainment",
        },
      },
      async () => ({
        mode: "inline-prep-only",
        hint: "Configure QStash for entertainment review generation",
        ...prep,
        targetReviews: productLimit,
      }),
    );

    const payload = (await queued.json()) as Record<string, unknown>;
    return NextResponse.json({
      ...payload,
      entertainmentPrep: prep,
      targetReviews: productLimit,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
