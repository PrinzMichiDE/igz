"use client";

import { useState, type FormEvent } from "react";

type Labels = {
  formTitle: string;
  formHint: string;
  name: string;
  context: string;
  email: string;
  emailHint: string;
  rating: string;
  title: string;
  body: string;
  usageWeeks: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
};

type Props = {
  productSlug: string;
  locale: "de" | "en";
  labels: Labels;
};

export function ExperienceCommentForm({ productSlug, locale, labels }: Props) {
  const [authorName, setAuthorName] = useState("");
  const [authorContext, setAuthorContext] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [usageWeeks, setUsageWeeks] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/products/${encodeURIComponent(productSlug)}/experience-comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            authorName,
            authorContext,
            authorEmail,
            rating,
            title,
            body,
            usageWeeks: usageWeeks ? Number(usageWeeks) : null,
            website,
          }),
        },
      );

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || labels.error);
      }

      setDone(true);
      setAuthorName("");
      setAuthorContext("");
      setAuthorEmail("");
      setRating(5);
      setTitle("");
      setBody("");
      setUsageWeeks("");
      setWebsite("");
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-surface-muted p-5">
      <h3 className="font-display text-lg font-semibold text-primary">
        {labels.formTitle}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {labels.formHint}
      </p>

      {done ? (
        <p className="mt-4 rounded-lg border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-primary">
          {labels.success}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-primary">
              {labels.name} *
            </span>
            <input
              required
              minLength={2}
              maxLength={80}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-primary">
              {labels.context}
            </span>
            <input
              maxLength={120}
              value={authorContext}
              onChange={(e) => setAuthorContext(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-primary">
              {labels.email}
            </span>
            <input
              type="email"
              maxLength={160}
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              {labels.emailHint}
            </span>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-primary">
              {labels.rating} *
            </span>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} ★
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-primary">
              {labels.title}
            </span>
            <input
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-primary">
              {labels.body} *
            </span>
            <textarea
              required
              minLength={40}
              maxLength={2500}
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-primary">
              {labels.usageWeeks}
            </span>
            <input
              type="number"
              min={1}
              max={104}
              value={usageWeeks}
              onChange={(e) => setUsageWeeks(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>

          {/* Honeypot */}
          <label className="hidden" aria-hidden="true">
            <span>Website</span>
            <input
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>

          {error ? (
            <p className="sm:col-span-2 text-sm text-red-600">{error}</p>
          ) : null}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-secondary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? labels.submitting : labels.submit}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
