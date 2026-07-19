"use client";

import { useMemo } from "react";
import { formatPrice } from "@/lib/utils";

export type PriceHistoryPoint = {
  price: number;
  recordedAt: string;
  currency: string;
};

type Props = {
  points: PriceHistoryPoint[];
  locale: string;
  title: string;
  emptyLabel: string;
  lowLabel: string;
  highLabel: string;
};

export function PriceHistoryChart({
  points,
  locale,
  title,
  emptyLabel,
  lowLabel,
  highLabel,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  const chart = useMemo(() => {
    if (points.length < 2) return null;
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = max === min ? Math.max(max * 0.05, 1) : (max - min) * 0.12;
    const yMin = Math.max(0, min - pad);
    const yMax = max + pad;
    const width = 640;
    const height = 220;
    const left = 12;
    const right = 12;
    const top = 16;
    const bottom = 28;
    const plotW = width - left - right;
    const plotH = height - top - bottom;

    const coords = points.map((point, index) => {
      const x =
        left +
        (points.length === 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
      const y =
        top +
        (1 - (point.price - yMin) / (yMax - yMin || 1)) * plotH;
      return { x, y, ...point };
    });

    const line = coords
      .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(" ");
    const area = `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(top + plotH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(top + plotH).toFixed(1)} Z`;

    const first = coords[0];
    const last = coords[coords.length - 1];
    const dateFmt = new Intl.DateTimeFormat(numberLocale, {
      day: "2-digit",
      month: "short",
    });

    return {
      width,
      height,
      line,
      area,
      coords,
      min,
      max,
      firstLabel: dateFmt.format(new Date(first.recordedAt)),
      lastLabel: dateFmt.format(new Date(last.recordedAt)),
      currency: last.currency || "EUR",
    };
  }, [points, numberLocale]);

  if (!chart) {
    return (
      <section className="igz-card p-5">
        <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      </section>
    );
  }

  return (
    <section className="igz-card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-primary">{title}</h2>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            {lowLabel}:{" "}
            <strong className="text-primary">
              {formatPrice(chart.min, chart.currency, numberLocale)}
            </strong>
          </span>
          <span>
            {highLabel}:{" "}
            <strong className="text-primary">
              {formatPrice(chart.max, chart.currency, numberLocale)}
            </strong>
          </span>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="h-56 w-full min-w-[280px]"
          role="img"
          aria-label={title}
        >
          <defs>
            <linearGradient id="igzPriceFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(37 99 235)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="rgb(37 99 235)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={chart.area} fill="url(#igzPriceFill)" />
          <path
            d={chart.line}
            fill="none"
            stroke="rgb(37 99 235)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {chart.coords.map((c) => (
            <circle
              key={`${c.recordedAt}-${c.price}`}
              cx={c.x}
              cy={c.y}
              r="3.2"
              fill="white"
              stroke="rgb(37 99 235)"
              strokeWidth="1.5"
            >
              <title>
                {formatPrice(c.price, c.currency, numberLocale)} ·{" "}
                {new Date(c.recordedAt).toLocaleString(numberLocale)}
              </title>
            </circle>
          ))}
          <text
            x="12"
            y={chart.height - 8}
            className="fill-zinc-500"
            fontSize="11"
          >
            {chart.firstLabel}
          </text>
          <text
            x={chart.width - 12}
            y={chart.height - 8}
            textAnchor="end"
            className="fill-zinc-500"
            fontSize="11"
          >
            {chart.lastLabel}
          </text>
        </svg>
      </div>
    </section>
  );
}
