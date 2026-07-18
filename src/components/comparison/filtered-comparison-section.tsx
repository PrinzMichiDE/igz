"use client";

import { useMemo, useState } from "react";
import {
  ComparisonTable,
  type ComparisonRow,
} from "@/components/comparison/comparison-table";

export type CategoryFilterState = {
  priceMin: number;
  priceMax: number;
  minScore: number;
  useCases: string[];
};

type FilterLabels = {
  filters: string;
  filterPrice: string;
  filterUseCase: string;
  filterMinScore: string;
  reset: string;
  results: string;
};

type TableLabels = {
  ctaLabel: string;
  ctaSublabel?: string;
  readLabel: string;
  availableOnAmazonLabel: string;
  columns: {
    model: string;
    specs: string;
    priceAction: string;
  };
};

type Props = {
  rows: ComparisonRow[];
  useCaseOptions: string[];
  priceBounds: { min: number; max: number };
  locale: string;
  filterLabels: FilterLabels;
  tableLabels: TableLabels;
};

function rowPrice(row: ComparisonRow): number | null {
  if (row.price === null || row.price === undefined) return null;
  const value = typeof row.price === "number" ? row.price : Number(row.price);
  return Number.isFinite(value) ? value : null;
}

export function FilteredComparisonSection({
  rows,
  useCaseOptions,
  priceBounds,
  locale,
  filterLabels,
  tableLabels,
}: Props) {
  const [priceMin, setPriceMin] = useState(priceBounds.min);
  const [priceMax, setPriceMax] = useState(priceBounds.max);
  const [minScore, setMinScore] = useState(0);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const price = rowPrice(row);
      if (price !== null && (price < priceMin || price > priceMax)) {
        return false;
      }
      if (
        typeof row.score === "number" &&
        minScore > 0 &&
        row.score < minScore
      ) {
        return false;
      }
      if (selectedUseCases.length > 0) {
        const haystack = `${row.title} ${row.excerpt ?? ""}`.toLowerCase();
        const matches = selectedUseCases.some((useCase) =>
          haystack.includes(useCase.toLowerCase()),
        );
        if (!matches) return false;
      }
      return true;
    });
  }, [rows, priceMin, priceMax, minScore, selectedUseCases]);

  function toggleUseCase(useCase: string) {
    setSelectedUseCases((current) =>
      current.includes(useCase)
        ? current.filter((item) => item !== useCase)
        : [...current, useCase],
    );
  }

  function resetFilters() {
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setMinScore(0);
    setSelectedUseCases([]);
  }

  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="igz-card h-fit p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-primary">
            {filterLabels.filters}
          </h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-secondary hover:underline"
          >
            {filterLabels.reset}
          </button>
        </div>

        <div className="mt-6">
          <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {filterLabels.filterPrice}
          </h3>
          <div className="mt-4 space-y-3">
            <input
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={10}
              value={priceMax}
              onChange={(event) => setPriceMax(Number(event.target.value))}
              className="w-full accent-secondary"
            />
            <div className="flex justify-between text-xs text-muted">
              <span>
                {priceMin.toLocaleString(numberLocale, {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })}
              </span>
              <span>
                {priceMax.toLocaleString(numberLocale, {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {filterLabels.filterMinScore}
          </h3>
          <input
            type="range"
            min={0}
            max={10}
            step={0.5}
            value={minScore}
            onChange={(event) => setMinScore(Number(event.target.value))}
            className="mt-4 w-full accent-secondary"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {minScore > 0 ? `${minScore.toFixed(1)}+` : "—"}
          </p>
        </div>

        {useCaseOptions.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {filterLabels.filterUseCase}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {useCaseOptions.map((useCase) => {
                const active = selectedUseCases.includes(useCase);
                return (
                  <button
                    key={useCase}
                    type="button"
                    onClick={() => toggleUseCase(useCase)}
                    className={
                      active
                        ? "rounded-full border border-secondary bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary"
                        : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-secondary/40"
                    }
                  >
                    {useCase}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="mt-6 text-xs text-muted">
          {filterLabels.results}: {filteredRows.length}/{rows.length}
        </p>
      </aside>

      <div>
        <ComparisonTable
          rows={filteredRows}
          locale={locale}
          ctaLabel={tableLabels.ctaLabel}
          ctaSublabel={tableLabels.ctaSublabel}
          readLabel={tableLabels.readLabel}
          availableOnAmazonLabel={tableLabels.availableOnAmazonLabel}
          columns={tableLabels.columns}
        />
      </div>
    </div>
  );
}
