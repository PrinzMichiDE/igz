import { NextRequest, NextResponse } from "next/server";
import { resolveCronCategory } from "@/lib/cron";
import { getQuotaStatus } from "@/lib/amazon/quota";
import {
  backfillMissingProductImages,
  syncCategoryDetails,
  syncCategorySearch,
} from "@/lib/amazon/sync";
import { QuotaExceededError } from "@/lib/amazon/quota";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("category");
  const detailsTopN = Number(req.nextUrl.searchParams.get("top") || 5);

  try {
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

      const imageBackfill = await backfillMissingProductImages(50);
      const quotaAfter = await getQuotaStatus();

      return NextResponse.json({
        ok: true,
        category: category.slug,
        searchResult,
        detailsResult,
        imageBackfill,
        quota: {
          before: quotaBefore,
          after: quotaAfter,
        },
      });
    });
  } catch (error) {
    const message = formatDatabaseError(error);
    const status = error instanceof QuotaExceededError ? 429 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
