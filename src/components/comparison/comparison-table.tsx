import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { CtaButton } from "@/components/affiliate/cta-button";
import { ScoreBadge } from "@/components/product/score-badge";
import { resolveProductImageSrc } from "@/lib/amazon/product-image";
import { formatPrice } from "@/lib/utils";

export type ComparisonRow = {
  rank: number;
  title: string;
  href: string;
  productId?: string;
  imageUrl?: string | null;
  imageMimeType?: string | null;
  score?: number | null;
  price?: number | string | null;
  currency?: string;
  ctaHref: string;
  excerpt?: string | null;
  badge?: string | null;
};

type Props = {
  rows: ComparisonRow[];
  locale: string;
  ctaLabel: string;
  ctaSublabel?: string;
  readLabel: string;
  availableOnAmazonLabel: string;
  columns: {
    model: string;
    specs: string;
    priceAction: string;
  };
};

export function ComparisonTable({
  rows,
  locale,
  ctaLabel,
  ctaSublabel,
  readLabel,
  availableOnAmazonLabel,
  columns,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] border-b border-border bg-surface-muted px-6 py-3 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
          <span>{columns.model}</span>
          <span>{columns.specs}</span>
          <span className="text-right">{columns.priceAction}</span>
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const imageSrc = resolveProductImageSrc(row);
            return (
            <article
              key={row.href}
              className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] items-center gap-6 px-6 py-5 transition hover:bg-surface-muted/60"
            >
              <div className="flex items-start gap-4">
                <a
                  href={row.ctaHref}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-muted"
                  aria-label={ctaLabel}
                >
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt=""
                      fill
                      className="object-contain p-2 transition group-hover:scale-105"
                      sizes="80px"
                      unoptimized
                    />
                  ) : null}
                </a>
                <div>
                  {row.badge ? (
                    <span className="mb-2 inline-flex rounded-full border border-secondary/20 bg-secondary/5 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-secondary uppercase">
                      {row.badge}
                    </span>
                  ) : null}
                  <h3 className="font-display text-lg font-semibold text-primary">
                    <Link href={row.href} className="hover:text-secondary">
                      {row.title}
                    </Link>
                  </h3>
                  {row.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {row.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    {typeof row.score === "number" ? (
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Star
                          className="h-4 w-4 fill-accent text-accent"
                          aria-hidden
                        />
                        {row.score.toFixed(1)}
                      </span>
                    ) : null}
                    <Link
                      href={row.href}
                      className="font-medium text-secondary hover:underline"
                    >
                      {readLabel}
                    </Link>
                  </div>
                </div>
                <ScoreBadge score={row.score} size="sm" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted">Score</span>
                  <ScoreBadge score={row.score} size="sm" />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted">#{row.rank}</span>
                  <span className="font-medium text-primary">{row.rank}</span>
                </div>
              </div>
              <div className="text-right">
                <a
                  href={row.ctaHref}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="font-display text-2xl font-bold text-primary transition hover:text-amazon-hover"
                >
                  {formatPrice(row.price, row.currency || "EUR", numberLocale)}
                </a>
                <div className="mt-3 flex flex-col items-end gap-2">
                  <CtaButton
                    href={row.ctaHref}
                    label={ctaLabel}
                    sublabel={ctaSublabel}
                    size="sm"
                    variant="amazon"
                  />
                  <p className="text-xs text-muted">{availableOnAmazonLabel}</p>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:hidden">
        {rows.map((row) => {
          const imageSrc = resolveProductImageSrc(row);
          return (
          <article key={row.href} className="igz-card p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted">#{row.rank}</span>
                <a
                  href={row.ctaHref}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="relative h-16 w-16 overflow-hidden rounded-lg bg-surface-muted"
                  aria-label={ctaLabel}
                >
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt=""
                      fill
                      className="object-contain p-2"
                      sizes="64px"
                      unoptimized
                    />
                  ) : null}
                </a>
              </div>
              <ScoreBadge score={row.score} size="sm" />
            </div>
            <h3 className="font-display text-base font-semibold text-primary">
              <Link href={row.href} className="hover:text-secondary">
                {row.title}
              </Link>
            </h3>
            <a
              href={row.ctaHref}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="mt-2 block text-lg font-bold text-primary transition hover:text-amazon-hover"
            >
              {formatPrice(row.price, row.currency || "EUR", numberLocale)}
            </a>
            <div className="mt-4 flex flex-col gap-2">
              <CtaButton
                href={row.ctaHref}
                label={ctaLabel}
                sublabel={ctaSublabel}
                size="sm"
                variant="amazon"
                className="w-full"
              />
              <p className="text-center text-xs text-muted">
                {availableOnAmazonLabel}
              </p>
              <Link
                href={row.href}
                className="text-center text-sm font-medium text-secondary hover:underline"
              >
                {readLabel}
              </Link>
            </div>
          </article>
          );
        })}
      </div>
    </>
  );
}
