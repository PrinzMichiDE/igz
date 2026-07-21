import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { PriceAlertManager } from "@/components/admin/price-alert-manager";
import { listRecentAdminAuditLogs } from "@/lib/admin/audit-log";
import { maskEmail } from "@/lib/admin/mask-email";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { aggregatePriceAlertCounts } from "@/lib/price-alerts/admin-stats";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminPriceAlertsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const statusFilter =
    params.status === "active" ||
    params.status === "triggered" ||
    params.status === "unsubscribed" ||
    params.status === "failed"
      ? params.status
      : "all";

  const [statusRows, alerts, auditLogs] = await Promise.all([
    prisma.priceAlert.findMany({ select: { status: true } }),
    prisma.priceAlert.findMany({
      where:
        statusFilter === "all"
          ? {}
          : {
              status: statusFilter as
                | "active"
                | "triggered"
                | "unsubscribed"
                | "failed",
            },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        locale: true,
        targetPrice: true,
        currency: true,
        status: true,
        createdAt: true,
        triggeredAt: true,
        lastNotifiedAt: true,
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            asin: true,
            price: true,
            currency: true,
          },
        },
      },
    }),
    listRecentAdminAuditLogs({ entityType: "price_alert", limit: 10 }),
  ]);

  const counts = aggregatePriceAlertCounts(statusRows);

  const filters = [
    { key: "all", label: "Alle", count: counts.total },
    { key: "active", label: "Aktiv", count: counts.active },
    { key: "triggered", label: "Ausgelöst", count: counts.triggered },
    { key: "unsubscribed", label: "Abgemeldet", count: counts.unsubscribed },
    { key: "failed", label: "Fehlgeschlagen", count: counts.failed },
  ] as const;

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Preisalarme
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wunschpreis-Abonnements · {counts.active} aktiv
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
        <AdminNav currentPath="/admin/price-alerts" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Aktiv
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.active}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ausgelöst
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.triggered}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Abgemeldet
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.unsubscribed}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Gesamt
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.total}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const active = statusFilter === filter.key;
          return (
            <Link
              key={filter.key}
              href={
                filter.key === "all"
                  ? "/admin/price-alerts"
                  : `/admin/price-alerts?status=${filter.key}`
              }
              className={
                active
                  ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                  : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              }
            >
              {filter.label} ({filter.count})
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <PriceAlertManager
          alerts={alerts.map((row) => ({
            id: row.id,
            emailMasked: maskEmail(row.email),
            locale: row.locale,
            targetPrice: Number(row.targetPrice),
            currency: row.currency,
            status: row.status,
            createdAt: row.createdAt.toISOString(),
            triggeredAt: row.triggeredAt?.toISOString() ?? null,
            lastNotifiedAt: row.lastNotifiedAt?.toISOString() ?? null,
            product: {
              id: row.product.id,
              title: row.product.title,
              slug: row.product.slug,
              asin: row.product.asin,
              currentPrice:
                row.product.price != null ? Number(row.product.price) : null,
              currency: row.product.currency,
            },
          }))}
        />
      </div>

      {auditLogs.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-primary">
            Audit-Log (Preisalarme)
          </h2>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface text-sm">
            {auditLogs.map((entry) => (
              <li key={entry.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-primary">{entry.action}</span>
                  <span className="text-xs text-muted">
                    {entry.createdAt.toLocaleString("de-DE")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {entry.actorEmail}
                  {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
