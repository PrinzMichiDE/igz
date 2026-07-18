import { NextRequest, NextResponse } from "next/server";
import { ensureTopAmazonCategories } from "@/lib/amazon/sync-categories";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const fetchFromApi = req.nextUrl.searchParams.get("api") !== "0";
  const limit = Number(req.nextUrl.searchParams.get("limit") || 50);
  const country = req.nextUrl.searchParams.get("country") || "DE";

  try {
    const result = await withDbRetry(() =>
      ensureTopAmazonCategories({
        country,
        limit: Number.isFinite(limit) ? Math.min(80, Math.max(1, limit)) : 50,
        fetchFromApi,
      }),
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
