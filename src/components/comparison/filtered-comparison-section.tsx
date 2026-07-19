"use client";

import { useMemo, useState } from "react";
import {
  ComparisonTable,
  type ComparisonRow,
} from "@/components/comparison/comparison-table";
import type { SpecFacetDefinition } from "@/lib/comparison/facets";

export type CategoryFilterState = {
  priceMin: number;
  priceMax: number;
  minScore: number;
  useCases: string[];
};

type FilterLabels = {
  filters: string;
  filterPrice: string;
  filterBrand: string;
  filterAllBrands: string;
  filterUseCase: string;
  filterMinScore: string;
  filterMinRating: string;
  filterAnyRating: string;
  filterSpecs: string;
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
  brandOptions: string[];
  specFacets: SpecFacetDefinition[];
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
  brandOptions,
  specFacets,
  priceBounds,
  locale,
  filterLabels,
  tableLabels,
}: Props) {
  const [priceMin, setPriceMin] = useState(priceBounds.min);
  const [priceMax, setPriceMax] = useState(priceBounds.max);
  const [minScore, setMinScore] = useState(0);
  const [minRating, setMinRating] = useState(0);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>(
    {},
  );

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
      if (
        minRating > 0 &&
        (typeof row.rating !== "number" || row.rating < minRating)
      ) {
        return false;
      }
      if (
        selectedBrands.length > 0 &&
        (!row.brand || !selectedBrands.includes(row.brand))
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
      for (const [key, values] of Object.entries(selectedSpecs)) {
        if (!values.length) continue;
        const productValue = row.specValues?.[key];
        if (!productValue || !values.includes(productValue)) return false;
      }
      return true;
    });
  }, [
    rows,
    priceMin,
    priceMax,
    minScore,
    minRating,
    selectedBrands,
    selectedUseCases,
    selectedSpecs,
  ]);

  function toggleUseCase(useCase: string) {
    setSelectedUseCases((current) =>
      current.includes(useCase)
        ? current.filter((item) => item !== useCase)
        : [...current, useCase],
    );
  }

  function toggleBrand(brand: string) {
    setSelectedBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand],
    );
  }

  function toggleSpecValue(key: string, value: string) {
    setSelectedSpecs((current) => {
      const existing = current[key] || [];
      const next = existing.includes(value)
        ? existing.filter((item) => item !== value)
        : [...existing, value];
      return { ...current, [key]: next };
    });
  }

  function resetFilters() {
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    setMinScore(0);
    setMinRating(0);
    setSelectedBrands([]);
    setSelectedUseCases([]);
    setSelectedSpecs({});
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
            <label className="block text-xs text-muted-foreground">
              Min
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={10}
                value={priceMin}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPriceMin(Math.min(next, priceMax));
                }}
                className="mt-1 w-full accent-secondary"
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Max
              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={10}
                value={priceMax}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPriceMax(Math.max(next, priceMin));
                }}
                className="mt-1 w-full accent-secondary"
              />
            </label>
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

        {brandOptions.length > 0 ? (
          <div className="mt-8">
            <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {filterLabels.filterBrand}
            </h3>
            <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
              {brandOptions.map((brand) => {
                const active = selectedBrands.includes(brand);
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => toggleBrand(brand)}
                    className={
                      active
                        ? "rounded-full border border-secondary bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary"
                        : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-secondary/40"
                    }
                  >
                    {brand}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

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

        <div className="mt-8">
          <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
            {filterLabels.filterMinRating}
          </h3>
          <input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={(event) => setMinRating(Number(event.target.value))}
            className="mt-4 w-full accent-amazon"
          />
          <p className="mt-1 text-sm text-muted-foreground">
            {minRating > 0
              ? `${minRating.toFixed(1)}★+`
              : filterLabels.filterAnyRating}
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

        {specFacets.length > 0 ? (
          <div className="mt-8 space-y-5">
            <h3 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {filterLabels.filterSpecs}
            </h3>
            {specFacets.map((facet) => (
              <div key={facet.key}>
                <p className="text-sm font-medium text-primary">{facet.label}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {facet.values.map((value) => {
                    const active = (selectedSpecs[facet.key] || []).includes(
                      value,
                    );
                    return (
                      <button
                        key={`${facet.key}-${value}`}
                        type="button"
                        onClick={() => toggleSpecValue(facet.key, value)}
                        className={
                          active
                            ? "rounded-full border border-secondary bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary"
                            : "rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                        }
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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
