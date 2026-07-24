import type { Locale } from "@prisma/client";

export const AFFILIATE_PERIOD_DAYS = [7, 30, 90] as const;

export type AffiliatePeriodDays = (typeof AFFILIATE_PERIOD_DAYS)[number];

export function isAffiliatePeriodDays(value: string): value is AffiliatePeriodDays {
  const parsed = Number.parseInt(value, 10);
  return AFFILIATE_PERIOD_DAYS.includes(parsed as AffiliatePeriodDays);
}

export function normalizeAffiliatePeriodDays(value?: string): AffiliatePeriodDays {
  const parsed = Number.parseInt(value ?? "30", 10);
  if (parsed === 7 || parsed === 30 || parsed === 90) {
    return parsed;
  }
  return 30;
}

export function affiliateSinceDate(
  days: AffiliatePeriodDays,
  now = new Date(),
): Date {
  return new Date(now.getTime() - days * 86_400_000);
}

export function normalizeAffiliatePagination(input: {
  page?: string;
  limit?: string;
}) {
  const page = Math.max(1, Number.parseInt(input.page ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(10, Number.parseInt(input.limit ?? "50", 10) || 50),
  );
  return { page, limit, offset: (page - 1) * limit };
}

export type AffiliateClickListFilter = {
  since?: Date;
  locale?: Locale;
  asin?: string;
  limit?: number;
  offset?: number;
};

export function buildAffiliateClickWhere(
  filter?: Pick<AffiliateClickListFilter, "since" | "locale" | "asin">,
) {
  if (!filter?.since && !filter?.locale && !filter?.asin) {
    return undefined;
  }

  return {
    ...(filter.since ? { createdAt: { gte: filter.since } } : {}),
    ...(filter.locale ? { locale: filter.locale } : {}),
    ...(filter.asin ? { asin: filter.asin } : {}),
  };
}

export function isAffiliateLocale(value: string): value is Locale {
  return value === "de" || value === "en";
}

export function countRecentAffiliateClicks(
  rows: { createdAt: Date }[],
  windowHours = 24,
  now = new Date(),
): number {
  const cutoff = now.getTime() - windowHours * 60 * 60 * 1000;
  return rows.filter((row) => row.createdAt.getTime() >= cutoff).length;
}

export function aggregateAffiliateLocaleCounts(
  rows: { locale: Locale }[],
): { de: number; en: number; total: number } {
  const counts = { de: 0, en: 0, total: rows.length };

  for (const row of rows) {
    switch (row.locale) {
      case "de":
        counts.de += 1;
        break;
      case "en":
        counts.en += 1;
        break;
      default: {
        const _exhaustive: never = row.locale;
        throw new Error(`Unknown locale: ${_exhaustive}`);
      }
    }
  }

  return counts;
}
