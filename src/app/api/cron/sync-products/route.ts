import { NextRequest, NextResponse } from "next/server";
import { resolveCronCategory } from "@/lib/cron";
import { getQuotaStatus, QuotaExceededError } from "@/lib/amazon/quota";
import {
  backfillMissingProductImages,
  syncCategoryDetails,
  syncCategorySearch,
} from "@/lib/amazon/sync";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("category");
  const detailsTopN = Number(req.nextUrl.searchParams.get("top") || 3);
  const forceInline = req.nextUrl.searchParams.get("inline") === "1";

  try {
    if (forceInline) {
      return await withDbRetry(async () => {
        const quotaBefore = await getQuotaStatus();
        const category = await resolveCronCategory(slug);
        if (!category) {
          return NextResponse.json(
            { error: "No category found. Run /api/cron/setup first." },
            { status: 404 },
          );
        }
        const searchResult = await syncCategorySearch(category.id);
        let detailsResult = { enriched: 0, requestsUsed: 0 };
        try {
          detailsResult = await syncCategoryDetails(category.id, detailsTopN);
        } catch (error) {
          if (!(error instanceof QuotaExceededError)) throw error;
        }
        const imageBackfill = await backfillMissingProductImages(20);
        return NextResponse.json({
          ok: true,
          mode: "inline-forced",
          category: category.slug,
          searchResult,
          detailsResult,
          imageBackfill,
          quota: {
            before: quotaBefore,
            after: await getQuotaStatus(),
          },
        });
      });
    }

    return await enqueueOrRunInline(
      {
        lockKey: "cron:sync-products",
        workflowPath: "/api/workflows/sync-products",
        body: {
          category: slug,
          top: detailsTopN,
          lockKey: "cron:sync-products",
        },
      },
      async () => {
        const quotaBefore = await getQuotaStatus();
        const category = await resolveCronCategory(slug);
        if (!category) {
          throw new Error("No category found. Run /api/cron/setup first.");
        }
        const searchResult = await syncCategorySearch(category.id);
        let detailsResult = { enriched: 0, requestsUsed: 0 };
        try {
          detailsResult = await syncCategoryDetails(category.id, detailsTopN);
        } catch (error) {
          if (!(error instanceof QuotaExceededError)) throw error;
        }
        const imageBackfill = await backfillMissingProductImages(20);
        return {
          category: category.slug,
          searchResult,
          detailsResult,
          imageBackfill,
          quota: {
            before: quotaBefore,
            after: await getQuotaStatus(),
          },
        };
      },
    );
  } catch (error) {
    const message = formatDatabaseError(error);
    const status = error instanceof QuotaExceededError ? 429 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
