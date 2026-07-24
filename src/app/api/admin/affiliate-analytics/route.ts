import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import {
  affiliateSinceDate,
  buildAffiliateClickWhere,
  isAffiliateLocale,
  isAffiliatePeriodDays,
  normalizeAffiliatePagination,
  normalizeAffiliatePeriodDays,
} from "@/lib/affiliate/admin-analytics";
import { getAffiliateAnalytics } from "@/lib/affiliate-analytics";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clickSelect = {
  id: true,
  asin: true,
  locale: true,
  path: true,
  referrer: true,
  createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = req.nextUrl.searchParams.get("days");
  const days =
    daysParam && isAffiliatePeriodDays(daysParam)
      ? normalizeAffiliatePeriodDays(daysParam)
      : normalizeAffiliatePeriodDays("30");

  const localeParam = req.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && isAffiliateLocale(localeParam) ? localeParam : undefined;

  const asin = req.nextUrl.searchParams.get("asin")?.trim() || undefined;

  const { page, limit, offset } = normalizeAffiliatePagination({
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });

  const since = affiliateSinceDate(days);
  const where = buildAffiliateClickWhere({ since, locale, asin });

  const [summary, total, clicks] = await Promise.all([
    getAffiliateAnalytics(days),
    prisma.affiliateClick.count({ where }),
    prisma.affiliateClick.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: clickSelect,
    }),
  ]);

  return NextResponse.json({
    days,
    summary,
    total,
    page,
    limit,
    clicks: clicks.map((click) => ({
      ...click,
      createdAt: click.createdAt.toISOString(),
    })),
  });
}
