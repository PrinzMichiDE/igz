"use client";

import { useMemo, useState } from "react";
import { ExperienceCommentForm } from "@/components/content/experience-comment-form";

type Comment = {
  id: string;
  authorName: string;
  authorContext?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  usageWeeks?: number | null;
  source?: string | null;
};

type Labels = {
  title: string;
  disclaimer: string;
  weeksLabel: string;
  emptyLabel: string;
  filterAll: string;
  filterPositive: string;
  filterCritical: string;
  sortRecent: string;
  sortRating: string;
  averageRating: string;
  countLabel: string;
  badgeAi: string;
  badgeUser: string;
  formTitle: string;
  formHint: string;
  formName: string;
  formContext: string;
  formEmail: string;
  formEmailHint: string;
  formRating: string;
  formReportTitle: string;
  formBody: string;
  formUsageWeeks: string;
  formSubmit: string;
  formSubmitting: string;
  formSuccess: string;
  formError: string;
};

type Props = {
  labels: Labels;
  comments: Comment[];
  productSlug: string;
  locale: "de" | "en";
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} / 5`} className="text-accent">
      {"★".repeat(Math.max(0, Math.min(5, rating)))}
      <span className="text-border">
        {"★".repeat(Math.max(0, 5 - Math.min(5, rating)))}
      </span>
    </span>
  );
}

function sourceBadge(source: string | null | undefined, labels: Labels) {
  if (source === "user_submitted") {
    return (
      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary">
        {labels.badgeUser}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
      {labels.badgeAi}
    </span>
  );
}

export function ExperienceCommentExplorer({
  labels,
  comments,
  productSlug,
  locale,
}: Props) {
  const [filter, setFilter] = useState<"all" | "positive" | "critical">("all");
  const [sort, setSort] = useState<"recent" | "rating">("recent");

  const filtered = useMemo(() => {
    let next = [...comments];

    if (filter === "positive") {
      next = next.filter((comment) => comment.rating >= 4);
    } else if (filter === "critical") {
      next = next.filter((comment) => comment.rating <= 3);
    }

    next.sort((a, b) => {
      if (sort === "rating") {
        return b.rating - a.rating;
      }
      return b.id.localeCompare(a.id);
    });

    return next;
  }, [comments, filter, sort]);

  const average =
    comments.length === 0
      ? null
      : comments.reduce((sum, comment) => sum + comment.rating, 0) /
        comments.length;

  return (
    <section id="nutzererfahrungen" className="mb-10">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-semibold text-primary">
          {labels.title}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {labels.disclaimer}
        </p>
      </div>

      {comments.length > 0 ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted px-4 py-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">
              {labels.averageRating}: {average?.toFixed(1)}
            </span>
            <span className="mx-2">·</span>
            <span>
              {comments.length} {labels.countLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: labels.filterAll },
              { key: "positive", label: labels.filterPositive },
              { key: "critical", label: labels.filterCritical },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key as typeof filter)}
                className={
                  filter === item.key
                    ? "rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-semibold text-secondary"
                    : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
                }
              >
                {item.label}
              </button>
            ))}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs"
            >
              <option value="recent">{labels.sortRecent}</option>
              <option value="rating">{labels.sortRating}</option>
            </select>
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{labels.emptyLabel}</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((comment) => (
            <article key={comment.id} className="igz-card p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-primary">
                      {comment.authorName}
                    </p>
                    {sourceBadge(comment.source, labels)}
                  </div>
                  {comment.authorContext ? (
                    <p className="text-xs text-muted-foreground">
                      {comment.authorContext}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <Stars rating={comment.rating} />
                  {comment.usageWeeks ? (
                    <p className="mt-1">
                      {comment.usageWeeks} {labels.weeksLabel}
                    </p>
                  ) : null}
                </div>
              </div>
              {comment.title ? (
                <h3 className="mb-2 text-sm font-semibold text-primary">
                  {comment.title}
                </h3>
              ) : null}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      )}

      <ExperienceCommentForm
        productSlug={productSlug}
        locale={locale}
        labels={{
          formTitle: labels.formTitle,
          formHint: labels.formHint,
          name: labels.formName,
          context: labels.formContext,
          email: labels.formEmail,
          emailHint: labels.formEmailHint,
          rating: labels.formRating,
          title: labels.formReportTitle,
          body: labels.formBody,
          usageWeeks: labels.formUsageWeeks,
          submit: labels.formSubmit,
          submitting: labels.formSubmitting,
          success: labels.formSuccess,
          error: labels.formError,
        }}
      />
    </section>
  );
}
