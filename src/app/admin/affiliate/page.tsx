import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { auth } from "@/lib/auth";
import {
  AFFILIATE_PERIOD_DAYS,
  affiliateSinceDate,
  buildAffiliateClickWhere,
  countRecentAffiliateClicks,
  isAffiliateLocale,
  normalizeAffiliatePagination,
  normalizeAffiliatePeriodDays,
} from "@/lib/affiliate/admin-analytics";
import { getAffiliateAnalytics } from "@/lib/affiliate-analytics";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    days?: string;
    locale?: string;
    asin?: string;
    page?: string;
  }>;
};

export default async function AdminAffiliatePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const days = normalizeAffiliatePeriodDays(params.days);
  const localeFilter =
    params.locale && isAffiliateLocale(params.locale)
      ? params.locale
      : undefined;
  const asinFilter = params.asin?.trim() || undefined;
  const { page, limit, offset } = normalizeAffiliatePagination({
    page: params.page,
  });

  const since = affiliateSinceDate(days);
  const where = buildAffiliateClickWhere({
    since,
    locale: localeFilter,
    asin: asinFilter,
  });

  const [analytics, recentForWindow, total, clicks] = await Promise.all([
    getAffiliateAnalytics(days),
    prisma.affiliateClick.findMany({
      where: { createdAt: { gte: affiliateSinceDate(7) } },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    prisma.affiliateClick.count({ where }),
    prisma.affiliateClick.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        asin: true,
        locale: true,
        path: true,
        referrer: true,
        createdAt: true,
      },
    }),
  ]);

  const clickAsins = [...new Set(clicks.map((click) => click.asin))];
  const productsByAsin =
    clickAsins.length > 0
      ? await prisma.product.findMany({
          where: { asin: { in: clickAsins } },
          select: { asin: true, title: true, slug: true },
        })
      : [];

  const clicksLast24h = countRecentAffiliateClicks(recentForWindow);
  const titleByAsin = new Map(productsByAsin.map((product) => [product.asin, product]));
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function filterHref(next: {
    days?: number;
    locale?: string;
    asin?: string;
    page?: number;
  }) {
    const query = new URLSearchParams();
    const nextDays = next.days ?? days;
    const nextLocale = next.locale ?? localeFilter;
    const nextAsin = next.asin ?? asinFilter;
    if (nextDays !== 30) query.set("days", String(nextDays));
    if (nextLocale) query.set("locale", nextLocale);
    if (nextAsin) query.set("asin", nextAsin);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const qs = query.toString();
    return qs ? `/admin/affiliate?${qs}` : "/admin/affiliate";
  }

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Affiliate-Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Amazon-Outbound-Klicks · {clicksLast24h} in 24h · Zeitraum {days} Tage
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary"
        >
          Zum Dashboard
        </Link>
      </div>

      <div className="mt-6">
        <AdminNav currentPath="/admin/affiliate" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Klicks ({days}T)
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {analytics.totalClicks}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Klicks (24h)
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {clicksLast24h}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Top-Locale
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {analytics.byLocale[0]?.locale?.toUpperCase() ?? "—"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {analytics.byLocale[0]?.clicks ?? 0} Klicks
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Gefilterte Einträge
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {total}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Zeitraum
        </p>
        <div className="flex flex-wrap gap-2">
          {AFFILIATE_PERIOD_DAYS.map((period) => (
            <Link
              key={period}
              href={filterHref({ days: period, page: 1 })}
              className={
                days === period
                  ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                  : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              }
            >
              {period} Tage
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Locale
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref({ locale: undefined, page: 1 })}
            className={
              !localeFilter
                ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
            }
          >
            Alle
          </Link>
          <Link
            href={filterHref({ locale: "de", page: 1 })}
            className={
              localeFilter === "de"
                ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
            }
          >
            DE
          </Link>
          <Link
            href={filterHref({ locale: "en", page: 1 })}
            className={
              localeFilter === "en"
                ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
            }
          >
            EN
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="font-display text-xl font-semibold text-primary">
            Top-Produkte
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left">
                <tr>
                  <th className="px-4 py-3">Produkt</th>
                  <th className="px-4 py-3">ASIN</th>
                  <th className="px-4 py-3 text-right">Klicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.topProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      Keine Klicks im Zeitraum
                    </td>
                  </tr>
                ) : (
                  analytics.topProducts.map((row) => (
                    <tr key={row.asin}>
                      <td className="px-4 py-3">
                        {row.slug ? (
                          <Link
                            href={`/de/produkt/${row.slug}`}
                            className="font-medium text-secondary hover:underline"
                          >
                            {row.title}
                          </Link>
                        ) : (
                          row.title
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {row.asin}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {row.clicks}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-primary">
            Top-Pfade
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left">
                <tr>
                  <th className="px-4 py-3">Pfad</th>
                  <th className="px-4 py-3 text-right">Klicks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analytics.topPaths.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      Keine Pfade im Zeitraum
                    </td>
                  </tr>
                ) : (
                  analytics.topPaths.map((row) => (
                    <tr key={row.path}>
                      <td className="max-w-md truncate px-4 py-3 font-mono text-xs">
                        {row.path}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {row.clicks}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">
          Klick-Log
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-4 py-3">Zeit</th>
                <th className="px-4 py-3">Produkt</th>
                <th className="px-4 py-3">ASIN</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Pfad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clicks.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Keine Klicks
                    {localeFilter ? ` für Locale „${localeFilter}"` : ""}
                    {asinFilter ? ` mit ASIN „${asinFilter}"` : ""}.
                  </td>
                </tr>
              ) : (
                clicks.map((click) => {
                  const product = titleByAsin.get(click.asin);
                  return (
                    <tr key={click.id}>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                        {click.createdAt.toLocaleString("de-DE")}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3">
                        {product?.title ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={filterHref({ asin: click.asin, page: 1 })}
                          className="text-secondary hover:underline"
                        >
                          {click.asin}
                        </Link>
                      </td>
                      <td className="px-4 py-3 uppercase text-muted">
                        {click.locale}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                        {click.path ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {asinFilter ? (
        <div className="mt-4">
          <Link
            href={filterHref({ asin: undefined, page: 1 })}
            className="text-sm font-semibold text-secondary hover:underline"
          >
            ASIN-Filter „{asinFilter}" entfernen
          </Link>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Seite {page} von {totalPages} · {total} Einträge
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={filterHref({ page: page - 1 })}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              >
                ← Zurück
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={filterHref({ page: page + 1 })}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              >
                Weiter →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
