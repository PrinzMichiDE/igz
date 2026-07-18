"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "igz-price-watch";

type WatchItem = {
  slug: string;
  title: string;
  price: number;
  currency: string;
  addedAt: string;
};

type Props = {
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  labels: {
    watch: string;
    watching: string;
    hint: string;
  };
};

function readWatchlist(): WatchItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WatchItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWatchlist(items: WatchItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function PriceWatchButton({ slug, title, price, currency, labels }: Props) {
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    setWatching(readWatchlist().some((item) => item.slug === slug));
  }, [slug]);

  function toggle() {
    const list = readWatchlist();
    if (watching) {
      writeWatchlist(list.filter((item) => item.slug !== slug));
      setWatching(false);
      return;
    }

    if (price === null) return;

    writeWatchlist([
      ...list.filter((item) => item.slug !== slug),
      {
        slug,
        title,
        price,
        currency,
        addedAt: new Date().toISOString(),
      },
    ]);
    setWatching(true);
  }

  if (price === null) return null;

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={toggle}
        className={
          watching
            ? "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-secondary bg-secondary/10 px-4 py-2.5 text-sm font-semibold text-secondary"
            : "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-secondary hover:text-secondary"
        }
      >
        {watching ? (
          <BellOff className="h-4 w-4" aria-hidden />
        ) : (
          <Bell className="h-4 w-4" aria-hidden />
        )}
        {watching ? labels.watching : labels.watch}
      </button>
      <p className="mt-2 text-center text-[11px] leading-5 text-muted">{labels.hint}</p>
    </div>
  );
}

export function getPriceWatchlist(): WatchItem[] {
  if (typeof window === "undefined") return [];
  return readWatchlist();
}
