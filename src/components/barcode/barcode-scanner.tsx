"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Flashlight,
  Keyboard,
  Loader2,
  ScanBarcode,
} from "lucide-react";
import type { BarcodeLookupResult } from "@/lib/barcode/lookup";
import { formatPrice } from "@/lib/utils";

type Labels = {
  title: string;
  subtitle: string;
  startCamera: string;
  stopCamera: string;
  manualTitle: string;
  manualPlaceholder: string;
  lookup: string;
  lookingUp: string;
  permissionHint: string;
  tip: string;
  foundReview: string;
  noReview: string;
  amazonOnly: string;
  notFound: string;
  invalid: string;
  quota: string;
  openReview: string;
  openAmazon: string;
  scanAgain: string;
  torchOn: string;
  torchOff: string;
};

type Props = {
  locale: "de" | "en";
  labels: Labels;
};

type LookupResponse = BarcodeLookupResult & { ok?: boolean; error?: string };

export function BarcodeScanner({ locale, labels }: Props) {
  const router = useRouter();
  const scannerId = useId().replace(/:/g, "");
  const regionId = `barcode-reader-${scannerId}`;
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const lastCodeRef = useRef<string>("");
  const [cameraOn, setCameraOn] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BarcodeLookupResult | null>(null);

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) {
      setCameraOn(false);
      setTorchOn(false);
      return;
    }
    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // ignore stop errors
    }
    setCameraOn(false);
    setTorchOn(false);
  }, []);

  const lookup = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed || busy) return;
      if (lastCodeRef.current === trimmed && result) return;

      setBusy(true);
      setError(null);
      try {
        scannerRef.current?.pause?.(true);
        const res = await fetch("/api/barcode/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed, locale, country: "DE" }),
        });
        const data = (await res.json()) as LookupResponse;
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || labels.notFound);
        }

        lastCodeRef.current = trimmed;
        setResult(data);

        if (data.product?.hasReview && data.product.reviewPath) {
          await stopCamera();
          router.push(data.product.reviewPath);
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : labels.notFound);
      } finally {
        setBusy(false);
      }
    },
    [busy, labels.notFound, locale, result, router, stopCamera],
  );

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    lastCodeRef.current = "";
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      await stopCamera();
      const scanner = new Html5Qrcode(regionId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 8,
          qrbox: (viewW: number, viewH: number) => {
            const edge = Math.min(viewW, viewH) * 0.78;
            return { width: edge, height: Math.min(edge * 0.55, viewH * 0.35) };
          },
          aspectRatio: 1.333,
          disableFlip: false,
        },
        (decoded) => {
          void lookup(decoded);
        },
        () => undefined,
      );
      setCameraOn(true);
    } catch {
      setError(labels.permissionHint);
      setCameraOn(false);
    }
  }, [labels.permissionHint, lookup, regionId, stopCamera]);

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, [stopCamera]);

  async function toggleTorch() {
    const scanner = scannerRef.current;
    if (!scanner) return;
    try {
      const next = !torchOn;
      await scanner.applyVideoConstraints({
        // Non-standard torch constraint supported on many Android devices.
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      // torch unsupported
    }
  }

  function statusMessage(key?: BarcodeLookupResult["messageKey"]) {
    if (key === "found_review") return labels.foundReview;
    if (key === "no_review") return labels.noReview;
    if (key === "amazon_only") return labels.amazonOnly;
    if (key === "not_found") return labels.notFound;
    if (key === "invalid") return labels.invalid;
    if (key === "quota") return labels.quota;
    return null;
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
          <ScanBarcode className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="font-display text-3xl font-bold text-primary">
          {labels.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {labels.subtitle}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
        <div id={regionId} className="min-h-[280px] w-full bg-zinc-900" />
        {!cameraOn ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 bg-zinc-900 px-6 py-10 text-center text-white">
            <Camera className="h-10 w-10 opacity-80" aria-hidden />
            <p className="text-sm text-zinc-300">{labels.permissionHint}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!cameraOn ? (
          <button
            type="button"
            onClick={() => void startCamera()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white"
          >
            <Camera className="h-4 w-4" aria-hidden />
            {labels.startCamera}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => void stopCamera()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary"
            >
              {labels.stopCamera}
            </button>
            <button
              type="button"
              onClick={() => void toggleTorch()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary"
            >
              <Flashlight className="h-4 w-4" aria-hidden />
              {torchOn ? labels.torchOff : labels.torchOn}
            </button>
          </>
        )}
      </div>

      <form
        className="mt-6 rounded-2xl border border-border bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void lookup(manualCode);
        }}
      >
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <Keyboard className="h-4 w-4" aria-hidden />
          {labels.manualTitle}
        </label>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder={labels.manualPlaceholder}
            className="w-full rounded-xl border border-border bg-surface-muted px-3 py-3 text-sm"
          />
          <button
            type="submit"
            disabled={busy || !manualCode.trim()}
            className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? labels.lookingUp : labels.lookup}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{labels.tip}</p>
      </form>

      {busy ? (
        <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {labels.lookingUp}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {result.code}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {statusMessage(result.messageKey)}
          </p>

          {result.product ? (
            <div className="mt-4 flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={result.product.imageUrl || "/favicon.ico"}
                alt=""
                className="h-24 w-24 rounded-xl border border-border object-contain bg-white"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-primary">
                  {result.product.title}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  ASIN {result.product.asin}
                  {result.product.price != null
                    ? ` · ${formatPrice(result.product.price, result.product.currency || "EUR", locale === "en" ? "en-US" : "de-DE")}`
                    : ""}
                  {result.product.rating != null
                    ? ` · ${result.product.rating.toFixed(1)}★`
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.product.hasReview && result.product.reviewPath ? (
                    <a
                      href={result.product.reviewPath}
                      className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white"
                    >
                      {labels.openReview}
                    </a>
                  ) : null}
                  {result.product.affiliateUrl ? (
                    <a
                      href={result.product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary"
                    >
                      {labels.openAmazon}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      lastCodeRef.current = "";
                      void startCamera();
                    }}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary"
                  >
                    {labels.scanAgain}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setResult(null);
                lastCodeRef.current = "";
                void startCamera();
              }}
              className="mt-4 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary"
            >
              {labels.scanAgain}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
