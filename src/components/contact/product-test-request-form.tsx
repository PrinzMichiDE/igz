"use client";

import { useState, type FormEvent } from "react";

export type ProductTestRequestLabels = {
  name: string;
  email: string;
  company: string;
  productTitle: string;
  amazonUrl: string;
  asin: string;
  categoryHint: string;
  message: string;
  canShipSample: string;
  canShipSampleHint: string;
  privacy: string;
  submit: string;
  submitting: string;
  success: string;
  error: string;
  requiredNote: string;
};

type Props = {
  locale: "de" | "en";
  privacyHref: string;
  labels: ProductTestRequestLabels;
};

export function ProductTestRequestForm({
  locale,
  privacyHref,
  labels,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [amazonUrl, setAmazonUrl] = useState("");
  const [asin, setAsin] = useState("");
  const [categoryHint, setCategoryHint] = useState("");
  const [message, setMessage] = useState("");
  const [canShipSample, setCanShipSample] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/contact/product-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          name,
          email,
          company,
          productTitle,
          amazonUrl,
          asin,
          categoryHint,
          message,
          canShipSample,
          privacyAccepted: privacyAccepted ? true : undefined,
          website,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || labels.error);
      }

      setDone(true);
      setName("");
      setEmail("");
      setCompany("");
      setProductTitle("");
      setAmazonUrl("");
      setAsin("");
      setCategoryHint("");
      setMessage("");
      setCanShipSample(false);
      setPrivacyAccepted(false);
      setWebsite("");
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-4 text-sm leading-relaxed text-primary">
        {labels.success}
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-2xl border border-border bg-surface p-5 sm:grid-cols-2 md:p-7"
    >
      <p className="sm:col-span-2 text-xs text-muted-foreground">
        {labels.requiredNote}
      </p>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-primary">
          {labels.name} *
        </span>
        <input
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-primary">
          {labels.email} *
        </span>
        <input
          required
          type="email"
          maxLength={160}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-primary">
          {labels.company}
        </span>
        <input
          maxLength={120}
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-primary">
          {labels.productTitle} *
        </span>
        <input
          required
          minLength={3}
          maxLength={200}
          value={productTitle}
          onChange={(e) => setProductTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-primary">
          {labels.amazonUrl}
        </span>
        <input
          type="url"
          maxLength={500}
          placeholder="https://www.amazon.de/dp/…"
          value={amazonUrl}
          onChange={(e) => setAmazonUrl(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-primary">{labels.asin}</span>
        <input
          maxLength={20}
          placeholder="B0XXXXXXXX"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm uppercase"
        />
      </label>

      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-primary">
          {labels.categoryHint}
        </span>
        <input
          maxLength={120}
          value={categoryHint}
          onChange={(e) => setCategoryHint(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block font-medium text-primary">
          {labels.message} *
        </span>
        <textarea
          required
          minLength={40}
          maxLength={3000}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
        />
      </label>

      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={canShipSample}
          onChange={(e) => setCanShipSample(e.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-medium text-primary">{labels.canShipSample}</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {labels.canShipSampleHint}
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm sm:col-span-2">
        <input
          required
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => setPrivacyAccepted(e.target.checked)}
          className="mt-1"
        />
        <span>
          {labels.privacy}{" "}
          <a href={privacyHref} className="text-blue-700 hover:underline">
            {locale === "en" ? "Privacy Policy" : "Datenschutzerklärung"}
          </a>
          .
        </span>
      </label>

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
          disabled={busy || !privacyAccepted}
          className="rounded-lg bg-secondary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? labels.submitting : labels.submit}
        </button>
      </div>
    </form>
  );
}
