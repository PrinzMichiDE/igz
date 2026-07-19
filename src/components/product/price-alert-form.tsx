"use client";

import { useState } from "react";

type Props = {
  productId: string;
  locale: string;
  currentPrice: number | null;
  currency: string;
  labels: {
    title: string;
    subtitle: string;
    email: string;
    targetPrice: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    privacy: string;
    privacyHint: string;
  };
};

export function PriceAlertForm({
  productId,
  locale,
  currentPrice,
  currency,
  labels,
}: Props) {
  const defaultTarget =
    currentPrice != null
      ? Math.max(1, Math.round(currentPrice * 0.9 * 100) / 100)
      : "";
  const [email, setEmail] = useState("");
  const [targetPrice, setTargetPrice] = useState(
    defaultTarget === "" ? "" : String(defaultTarget),
  );
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          locale,
          email,
          targetPrice: Number(targetPrice),
          currency,
          privacyAccepted,
          website: "",
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        throw new Error(json.error || labels.error);
      }
      setMessage(labels.success);
      setEmail("");
      setPrivacyAccepted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="igz-card p-5">
      <h2 className="font-display text-lg font-semibold text-primary">
        {labels.title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{labels.subtitle}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="font-medium text-primary">{labels.email}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-primary">{labels.targetPrice}</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              required
              min={1}
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2"
            />
            <span className="text-sm text-muted">{currency}</span>
          </div>
        </label>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            required
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1"
          />
          <span>
            <span className="font-medium text-primary">{labels.privacy}</span>
            <span className="mt-0.5 block text-xs">{labels.privacyHint}</span>
          </span>
        </label>
        {/* honeypot */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />
        <button
          type="submit"
          disabled={busy || !privacyAccepted}
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? labels.submitting : labels.submit}
        </button>
        {message ? (
          <p className="text-sm font-medium text-emerald-700">{message}</p>
        ) : null}
        {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
      </form>
    </section>
  );
}
