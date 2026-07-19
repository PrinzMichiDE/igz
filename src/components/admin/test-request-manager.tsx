"use client";

import { useState } from "react";

export type AdminTestRequestRow = {
  id: string;
  locale: "de" | "en";
  status: "pending" | "reviewed" | "accepted" | "declined";
  name: string;
  email: string;
  company: string | null;
  productTitle: string;
  amazonUrl: string | null;
  asin: string | null;
  categoryHint: string | null;
  message: string;
  canShipSample: boolean;
  adminNote: string | null;
  createdAt: string;
};

type Props = {
  requests: AdminTestRequestRow[];
};

const STATUS_OPTIONS: AdminTestRequestRow["status"][] = [
  "pending",
  "reviewed",
  "accepted",
  "declined",
];

export function TestRequestManager({ requests: initial }: Props) {
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateRow(
    id: string,
    patch: { status?: AdminTestRequestRow["status"]; adminNote?: string },
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/test-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Update failed");
      }
      const data = (await res.json()) as { request: AdminTestRequestRow };
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...data.request } : row)),
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
        Noch keine Testanfragen.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-xl border border-border bg-surface p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-primary">
                {row.productTitle}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(row.createdAt).toLocaleString("de-DE")} ·{" "}
                {row.locale.toUpperCase()}
                {row.canShipSample ? " · Muster möglich" : ""}
              </p>
            </div>
            <select
              value={row.status}
              disabled={busyId === row.id}
              onChange={(e) =>
                updateRow(row.id, {
                  status: e.target.value as AdminTestRequestRow["status"],
                })
              }
              className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <dl className="mt-4 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Absender
              </dt>
              <dd>
                {row.name}
                {row.company ? ` · ${row.company}` : ""}
                <br />
                <a
                  href={`mailto:${row.email}`}
                  className="text-blue-700 hover:underline"
                >
                  {row.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-muted">
                Produkt
              </dt>
              <dd>
                {row.asin ? `ASIN ${row.asin}` : "ohne ASIN"}
                {row.categoryHint ? ` · ${row.categoryHint}` : ""}
                {row.amazonUrl ? (
                  <>
                    <br />
                    <a
                      href={row.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline break-all"
                    >
                      {row.amazonUrl}
                    </a>
                  </>
                ) : null}
              </dd>
            </div>
          </dl>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {row.message}
          </p>

          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Admin-Notiz
            </span>
            <textarea
              defaultValue={row.adminNote || ""}
              rows={2}
              disabled={busyId === row.id}
              onBlur={(e) => {
                const next = e.target.value.trim();
                if (next === (row.adminNote || "")) return;
                void updateRow(row.id, { adminNote: next });
              }}
              className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
            />
          </label>
        </article>
      ))}
    </div>
  );
}
