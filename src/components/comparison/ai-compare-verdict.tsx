"use client";

import { useState } from "react";

type Props = {
  locale: string;
  slugA: string;
  slugB: string;
  labels: {
    title: string;
    button: string;
    loading: string;
    error: string;
    forA: string;
    forB: string;
    bottomLine: string;
  };
};

type Result = {
  winnerSlug: string;
  summary: string;
  forA: string[];
  forB: string[];
  bottomLine: string;
};

export function AiCompareVerdict({ locale, slugA, slugB, labels }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compare/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, slugA, slugB }),
      });
      const json = (await res.json()) as Result & { error?: string };
      if (!res.ok) throw new Error(json.error || labels.error);
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">{labels.title}</h2>
        <button
          type="button"
          onClick={() => void run()}
          disabled={loading}
          className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? labels.loading : labels.button}
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

      {result ? (
        <div className="mt-4 space-y-4 text-sm text-zinc-800">
          <p className="aeo-direct-answer text-base font-medium">
            {result.summary}
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-white p-3">
              <p className="mb-2 font-semibold">{labels.forA}</p>
              <ul className="space-y-1">
                {result.forA?.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-white p-3">
              <p className="mb-2 font-semibold">{labels.forB}</p>
              <ul className="space-y-1">
                {result.forB?.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p>
            <span className="font-semibold">{labels.bottomLine}: </span>
            {result.bottomLine}
          </p>
        </div>
      ) : null}
    </section>
  );
}
