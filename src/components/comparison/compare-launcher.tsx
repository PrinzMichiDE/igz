"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildComparePairSlug } from "@/lib/compare/pair";

type Option = {
  slug: string;
  title: string;
};

type Props = {
  locale: string;
  currentSlug?: string;
  options: Option[];
  labels: {
    title: string;
    select: string;
    cta: string;
    helper: string;
  };
};

export function CompareLauncher({
  locale,
  currentSlug,
  options,
  labels,
}: Props) {
  const router = useRouter();
  const [left, setLeft] = useState(currentSlug || options[0]?.slug || "");
  const [right, setRight] = useState(
    options.find((o) => o.slug !== (currentSlug || options[0]?.slug))?.slug ||
      "",
  );

  const disabled = useMemo(
    () => !left || !right || left === right,
    [left, right],
  );

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">{labels.title}</h2>
      <p className="mt-1 text-xs text-zinc-500">{labels.helper}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            {labels.select} A
          </span>
          <select
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2"
          >
            {options.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-zinc-600">
            {labels.select} B
          </span>
          <select
            value={right}
            onChange={(e) => setRight(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2"
          >
            {options.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          const pair = buildComparePairSlug(left, right);
          router.push(`/${locale}/vergleich/${pair}`);
        }}
        className="mt-4 inline-flex rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-40"
      >
        {labels.cta}
      </button>
    </section>
  );
}
