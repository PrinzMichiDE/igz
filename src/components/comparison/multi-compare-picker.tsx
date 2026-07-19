"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type MultiCompareOption = {
  slug: string;
  title: string;
};

type Props = {
  locale: string;
  options: MultiCompareOption[];
  initialSlugs?: string[];
  labels: {
    title: string;
    helper: string;
    selected: string;
    cta: string;
    clear: string;
    maxHint: string;
  };
};

const MAX = 4;
const MIN = 2;

export function MultiComparePicker({
  locale,
  options,
  initialSlugs = [],
  labels,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(
    initialSlugs.filter(Boolean).slice(0, MAX),
  );

  const selectedTitles = useMemo(() => {
    return selected
      .map((slug) => options.find((option) => option.slug === slug)?.title)
      .filter(Boolean);
  }, [options, selected]);

  function toggle(slug: string) {
    setSelected((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }
      if (current.length >= MAX) return current;
      return [...current, slug];
    });
  }

  function openCompare() {
    if (selected.length < MIN) return;
    const params = new URLSearchParams();
    params.set("slugs", selected.join(","));
    router.push(`/${locale}/vergleich?${params.toString()}`);
  }

  return (
    <section className="igz-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-primary">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{labels.helper}</p>
        </div>
        <p className="text-xs font-semibold text-secondary">
          {labels.selected}: {selected.length}/{MAX}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.slug);
          const disabled = !active && selected.length >= MAX;
          return (
            <button
              key={option.slug}
              type="button"
              disabled={disabled}
              onClick={() => toggle(option.slug)}
              className={
                active
                  ? "rounded-full border border-secondary bg-secondary/10 px-3 py-1.5 text-sm font-semibold text-secondary"
                  : disabled
                    ? "cursor-not-allowed rounded-full border border-border px-3 py-1.5 text-sm text-muted opacity-50"
                    : "rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-secondary/40"
              }
            >
              {option.title}
            </button>
          );
        })}
      </div>

      {selectedTitles.length > 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {selectedTitles.join(" · ")}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted">{labels.maxHint}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={openCompare}
          disabled={selected.length < MIN}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {labels.cta}
        </button>
        <button
          type="button"
          onClick={() => setSelected([])}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary"
        >
          {labels.clear}
        </button>
      </div>
    </section>
  );
}
