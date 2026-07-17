import { NextRequest, NextResponse } from "next/server";
import { assertCronAuthorized, resolveCronCategory } from "@/lib/cron";
import { prisma } from "@/lib/db/prisma";
import { getQuotaStatus } from "@/lib/amazon/quota";
import { syncCategoryDetails, syncCategorySearch } from "@/lib/amazon/sync";
import { QuotaExceededError } from "@/lib/amazon/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!assertCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("category");
  const detailsTopN = Number(req.nextUrl.searchParams.get("top") || 5);

  try {
    const quotaBefore = await getQuotaStatus();
    const category = await resolveCronCategory(slug);

    if (!category) {
      return NextResponse.json(
        { error: "No category found. Run seed first." },
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

    const quotaAfter = await getQuotaStatus();

    return NextResponse.json({
      ok: true,
      category: category.slug,
      searchResult,
      detailsResult,
      quota: {
        before: quotaBefore,
        after: quotaAfter,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof QuotaExceededError ? 429 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
