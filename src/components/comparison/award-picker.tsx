"use client";

import { useState } from "react";
import { CtaButton } from "@/components/affiliate/cta-button";
import { AwardBadge } from "@/components/comparison/award-badge";
import { formatPrice } from "@/lib/utils";

type AwardOption = {
  key: "winner" | "price" | "budget";
  badgeType: "testsieger" | "preisLeistung" | "budget";
  label: string;
  title: string;
  reason: string;
  price?: number | string | null;
  currency?: string;
  href: string;
  ctaHref: string;
};

type Labels = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  readReview: string;
};

type Props = {
  options: AwardOption[];
  locale: string;
  labels: Labels;
};

export function AwardPicker({ options, locale, labels }: Props) {
  const [selected, setSelected] = useState(options[0]?.key ?? "winner");
  const active = options.find((option) => option.key === selected) ?? options[0];
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  if (!active || options.length === 0) return null;

  return (
    <section className="igz-card mb-10 p-6">
      <h2 className="font-display text-xl font-semibold text-primary">
        {labels.title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setSelected(option.key)}
            className={
              selected === option.key
                ? "rounded-full border border-secondary bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary"
                : "rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-secondary/40"
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface-muted p-5">
        <AwardBadge type={active.badgeType} label={active.label} />
        <h3 className="mt-4 font-display text-lg font-semibold text-primary">
          {active.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {active.reason}
        </p>
        <p className="mt-4 text-2xl font-bold text-primary">
          {formatPrice(active.price, active.currency || "EUR", numberLocale)}
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <CtaButton href={active.ctaHref} label={labels.ctaLabel} />
          <a
            href={active.href}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-secondary hover:text-secondary"
          >
            {labels.readReview}
          </a>
        </div>
      </div>
    </section>
  );
}
