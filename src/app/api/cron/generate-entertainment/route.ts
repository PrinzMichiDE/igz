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
  entertainmentDailyReviewTarget,
  entertainmentSyncSlugForToday,
} from "@/lib/entertainment";
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";
import type { Locale } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily entertainment pipeline:
 * 1) Ensure Filme / Serien / Videospiele categories exist
 * 2) Sync one rotating entertainment category (saves RapidAPI quota)
 * 3) Enqueue 10–20 missing reviews diversified across those categories
 */
export async function GET(req: NextRequest) {
  const locales = (req.nextUrl.searchParams.get("locales") || "de")
    .split(",")
    .map((v) => v.trim())
    .filter((v): v is Locale => v === "de" || v === "en");
  const force = req.nextUrl.searchParams.get("force") === "1";
  const skipSync = req.nextUrl.searchParams.get("skipSync") === "1";
  const productLimit = Math.min(
    20,
    Math.max(
      10,
      Number(
        req.nextUrl.searchParams.get("products") ||
          entertainmentDailyReviewTarget(),
      ),
    ),
  );
  const chainRemaining = Number(req.nextUrl.searchParams.get("chain") || 4);
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
        limit: Math.min(productLimit, 8),
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
          backfillMissing: true,
          diversify: true,
          chainRemaining: Math.max(0, Math.min(8, chainRemaining)),
          fromCron: true,
          lockKey: "cron:generate-entertainment",
        },
      },
      async () => ({
        mode: "inline-prep-only",
        hint: "Configure QStash for full entertainment review generation",
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
