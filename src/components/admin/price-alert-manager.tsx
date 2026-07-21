"use client";

import Link from "next/link";
import { useState } from "react";

export type AdminPriceAlertRow = {
  id: string;
  emailMasked: string;
  locale: "de" | "en";
  targetPrice: number;
  currency: string;
  status: "active" | "triggered" | "unsubscribed" | "failed";
  createdAt: string;
  triggeredAt: string | null;
  lastNotifiedAt: string | null;
  product: {
    id: string;
    title: string;
    slug: string;
    asin: string;
    currentPrice: number | null;
    currency: string;
  };
};

type Props = {
  alerts: AdminPriceAlertRow[];
};

const STATUS_LABEL: Record<AdminPriceAlertRow["status"], string> = {
  active: "Aktiv",
  triggered: "Ausgelöst",
  unsubscribed: "Abgemeldet",
  failed: "Fehlgeschlagen",
};

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function PriceAlertManager({ alerts: initial }: Props) {
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cancelAlert(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/price-alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unsubscribed" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Update failed");
      }
      const data = (await res.json()) as { alert: AdminPriceAlertRow };
      setRows((prev) =>
        prev.map((row) =>
          row.id === id ? { ...row, status: data.alert.status } : row,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
        Keine Preisalarme für diesen Filter.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left">
            <tr>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3">E-Mail</th>
              <th className="px-4 py-3">Wunschpreis</th>
              <th className="px-4 py-3">Aktuell</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Erstellt</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/${row.locale}/produkt/${row.product.slug}`}
                    className="font-medium text-secondary hover:underline"
                  >
                    {row.product.title}
                  </Link>
                  <p className="text-xs text-muted">{row.product.asin}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{row.emailMasked}</td>
                <td className="px-4 py-3">
                  {formatPrice(row.targetPrice, row.currency)}
                </td>
                <td className="px-4 py-3">
                  {row.product.currentPrice != null
                    ? formatPrice(row.product.currentPrice, row.product.currency)
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.status === "active"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800"
                        : row.status === "triggered"
                          ? "rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800"
                          : "rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold text-muted"
                    }
                  >
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {new Date(row.createdAt).toLocaleString("de-DE")}
                </td>
                <td className="px-4 py-3 text-right">
                  {row.status === "active" ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => cancelAlert(row.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:border-red-400 hover:text-red-700 disabled:opacity-50"
                    >
                      {busyId === row.id ? "…" : "Stornieren"}
                    </button>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
