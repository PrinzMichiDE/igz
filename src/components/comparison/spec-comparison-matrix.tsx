"use client";

import { useMemo, useState } from "react";
import { CtaButton } from "@/components/affiliate/cta-button";

type Column = {
  key: string;
  label: string;
  group?: string | null;
};

type MatrixRow = {
  id: string;
  title: string;
  ctaHref?: string;
  values: Array<string | null>;
};

type Props = {
  title: string;
  featureLabel: string;
  missingLabel: string;
  ctaLabel: string;
  columns: Column[];
  rows: MatrixRow[];
  hideIdenticalLabel?: string;
  showAllLabel?: string;
  differencesHint?: string;
};

function normalizeCell(value: string | null | undefined) {
  if (value == null) return "";
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function rowIsIdentical(values: Array<string | null | undefined>) {
  if (values.length <= 1) return true;
  const first = normalizeCell(values[0]);
  return values.every((value) => normalizeCell(value) === first);
}

export function SpecComparisonMatrix({
  title,
  featureLabel,
  missingLabel,
  ctaLabel,
  columns,
  rows,
  hideIdenticalLabel = "Nur Unterschiede",
  showAllLabel = "Alle Merkmale",
  differencesHint,
}: Props) {
  const [hideIdentical, setHideIdentical] = useState(true);

  const visibleColumns = useMemo(() => {
    if (!hideIdentical) return columns.map((column, index) => ({ column, index }));
    return columns
      .map((column, index) => ({ column, index }))
      .filter(({ index }) => {
        const values = rows.map((row) => row.values[index] ?? null);
        return !rowIsIdentical(values);
      });
  }, [columns, rows, hideIdentical]);

  if (columns.length === 0 || rows.length === 0) return null;

  const hiddenCount = columns.length - visibleColumns.length;

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-primary">
            {title}
          </h2>
          {differencesHint ? (
            <p className="mt-1 text-sm text-muted-foreground">{differencesHint}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHideIdentical(true)}
            className={
              hideIdentical
                ? "rounded-full border border-secondary bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary"
                : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
            }
          >
            {hideIdenticalLabel}
          </button>
          <button
            type="button"
            onClick={() => setHideIdentical(false)}
            className={
              !hideIdentical
                ? "rounded-full border border-secondary bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary"
                : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
            }
          >
            {showAllLabel}
            {hiddenCount > 0 && hideIdentical ? ` (+${hiddenCount})` : ""}
          </button>
        </div>
      </div>

      {visibleColumns.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface-muted/50 px-4 py-6 text-sm text-muted-foreground">
          {differencesHint ||
            "Alle verglichenen Specs sind identisch. Schalte auf „Alle Merkmale“ um."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-4 py-3 font-semibold tracking-wide text-muted uppercase">
                  {featureLabel}
                </th>
                {rows.map((row) => (
                  <th
                    key={row.id}
                    className="px-4 py-3 font-semibold text-primary"
                  >
                    <div className="space-y-2">
                      {row.ctaHref ? (
                        <a
                          href={row.ctaHref}
                          target="_blank"
                          rel="nofollow sponsored noopener noreferrer"
                          className="block hover:text-amazon-hover"
                        >
                          {row.title}
                        </a>
                      ) : (
                        row.title
                      )}
                      {row.ctaHref ? (
                        <CtaButton
                          href={row.ctaHref}
                          label={ctaLabel}
                          size="sm"
                          variant="amazon"
                          className="w-full"
                        />
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleColumns.map(({ column, index }) => {
                const values = rows.map((row) => row.values[index] ?? null);
                const differs = !rowIsIdentical(values);
                return (
                  <tr
                    key={column.key}
                    className={
                      differs
                        ? "bg-amber-50/60 hover:bg-amber-50"
                        : "hover:bg-surface-muted/50"
                    }
                  >
                    <td className="px-4 py-3 font-medium text-primary">
                      <div>{column.label}</div>
                      {column.group ? (
                        <div className="mt-0.5 text-[11px] text-muted">
                          {column.group}
                        </div>
                      ) : null}
                    </td>
                    {rows.map((row) => {
                      const value = row.values[index];
                      return (
                        <td
                          key={`${row.id}-${column.key}`}
                          className={`px-4 py-3 text-center ${
                            differs
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {value ? (
                            <span>{value}</span>
                          ) : (
                            <span className="text-muted">{missingLabel}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
