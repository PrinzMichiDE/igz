"use client";

import { useState } from "react";

type Props = {
  labels: {
    title: string;
    helper: string;
    igdbId: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    openReview: string;
  };
};

export function AdminGameReviewForm({ labels }: Props) {
  const [igdbId, setIgdbId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    path: string;
  } | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/games/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igdbId: Number(igdbId),
          locales: ["de"],
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        game?: { name: string };
        reviews?: Array<{ path: string }>;
      };
      if (!res.ok) {
        throw new Error(json.error || labels.error);
      }
      setResult({
        name: json.game?.name || "OK",
        path: json.reviews?.[0]?.path || "/de/spiele",
      });
      setIgdbId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="igz-card space-y-4 p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-primary">
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{labels.helper}</p>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-primary">{labels.igdbId}</span>
        <input
          type="number"
          min={1}
          required
          value={igdbId}
          onChange={(event) => setIgdbId(event.target.value)}
          placeholder="z.B. 1942"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={busy || !igdbId}
        className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? labels.submitting : labels.submit}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? (
        <p className="text-sm text-emerald-700">
          {labels.success}: {result.name}{" "}
          <a href={result.path} className="font-semibold underline">
            {labels.openReview}
          </a>
        </p>
      ) : null}
    </form>
  );
}
