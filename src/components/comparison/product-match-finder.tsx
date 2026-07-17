"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { CtaButton } from "@/components/affiliate/cta-button";
import {
  rankProductsForMatch,
  type MatchCandidate,
  type MatchPriority,
} from "@/lib/product-ranking";
import { formatPrice } from "@/lib/utils";

type Labels = {
  title: string;
  subtitle: string;
  budget: string;
  priority: string;
  priorityScore: string;
  priorityPrice: string;
  priorityRating: string;
  useCase: string;
  useCasePlaceholder: string;
  submit: string;
  resultTitle: string;
  resultEmpty: string;
  readReview: string;
  ctaLabel: string;
};

type Props = {
  candidates: MatchCandidate[];
  locale: string;
  labels: Labels;
};

export function ProductMatchFinder({ candidates, locale, labels }: Props) {
  const maxPrice = useMemo(() => {
    const prices = candidates
      .map((candidate) => candidate.price)
      .filter((price): price is number => price !== null);
    return Math.max(...prices, 300);
  }, [candidates]);

  const [budgetMax, setBudgetMax] = useState(Math.round(maxPrice * 0.8));
  const [priority, setPriority] = useState<MatchPriority>("score");
  const [useCase, setUseCase] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(() => {
    if (!submitted) return [];
    return rankProductsForMatch(candidates, {
      budgetMax,
      priority,
      useCase,
    }).slice(0, 3);
  }, [submitted, candidates, budgetMax, priority, useCase]);

  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <section className="igz-card mb-10 p-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold text-primary">
            {labels.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-primary">
            {labels.budget}
          </span>
          <input
            type="range"
            min={50}
            max={Math.ceil(maxPrice)}
            step={10}
            value={budgetMax}
            onChange={(event) => setBudgetMax(Number(event.target.value))}
            className="w-full accent-secondary"
          />
          <span className="mt-1 block text-sm text-muted-foreground">
            {formatPrice(budgetMax, "EUR", numberLocale)}
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-primary">
            {labels.priority}
          </span>
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as MatchPriority)
            }
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="score">{labels.priorityScore}</option>
            <option value="price">{labels.priorityPrice}</option>
            <option value="rating">{labels.priorityRating}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-primary">
            {labels.useCase}
          </span>
          <input
            type="text"
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            placeholder={labels.useCasePlaceholder}
            className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setSubmitted(true)}
        className="mt-5 rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary-strong"
      >
        {labels.submit}
      </button>

      {submitted ? (
        <div className="mt-8">
          <h3 className="font-display text-lg font-semibold text-primary">
            {labels.resultTitle}
          </h3>
          {results.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {labels.resultEmpty}
            </p>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {results.map(({ candidate }, index) => (
                <article
                  key={candidate.id}
                  className="rounded-xl border border-border bg-surface-muted p-4"
                >
                  <p className="text-xs font-semibold tracking-wide text-secondary uppercase">
                    #{index + 1}
                  </p>
                  <h4 className="mt-2 font-display text-base font-semibold text-primary">
                    <Link href={candidate.href} className="hover:text-secondary">
                      {candidate.title}
                    </Link>
                  </h4>
                  <p className="mt-2 text-lg font-bold text-primary">
                    {formatPrice(candidate.price, candidate.currency, numberLocale)}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <CtaButton
                      href={candidate.ctaHref}
                      label={labels.ctaLabel}
                      size="sm"
                      className="w-full"
                    />
                    <Link
                      href={candidate.href}
                      className="text-center text-sm font-medium text-secondary hover:underline"
                    >
                      {labels.readReview}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
