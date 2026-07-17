import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { CtaButton } from "@/components/affiliate/cta-button";
import { formatPrice } from "@/lib/utils";

type Props = {
  href: string;
  title: string;
  imageUrl?: string | null;
  score?: number | null;
  price?: number | string | null;
  currency?: string;
  locale: string;
  ctaLabel: string;
  ctaHref: string;
  readLabel: string;
  discountPercent?: number | null;
  variant?: "default" | "featured";
  badge?: string;
};

export function ProductCard({
  href,
  title,
  imageUrl,
  score,
  price,
  currency = "EUR",
  locale,
  ctaLabel,
  ctaHref,
  readLabel,
  discountPercent,
  variant = "default",
  badge,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";
  const rating =
    typeof score === "number" && Number.isFinite(score) ? score : null;

  if (variant === "featured") {
    return (
      <article className="igz-card igz-card-hover grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-56 bg-surface-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain p-8"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
          ) : null}
          {badge ? (
            <span className="absolute top-4 left-4 rounded-full border border-secondary/20 bg-white px-3 py-1 text-xs font-semibold text-secondary">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col p-6">
          <h3 className="font-display text-xl font-semibold text-primary">
            <Link href={href} className="hover:text-secondary">
              {title}
            </Link>
          </h3>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            {rating ? (
              <>
                <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
                <span className="font-medium text-primary">{rating.toFixed(1)}</span>
              </>
            ) : null}
          </div>
          <p className="mt-auto pt-6 text-2xl font-bold text-primary">
            {formatPrice(price, currency, numberLocale)}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <CtaButton href={ctaHref} label={ctaLabel} className="flex-1" />
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-secondary hover:text-secondary"
            >
              {readLabel}
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="igz-card igz-card-hover flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[4/3] bg-surface-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain p-6"
            sizes="(max-width: 768px) 100vw, 25vw"
            unoptimized
          />
        ) : null}
        {typeof discountPercent === "number" ? (
          <span className="absolute top-3 right-3 rounded-md bg-danger px-2 py-1 text-xs font-bold text-white">
            -{discountPercent}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          {rating ? (
            <>
              <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
              <span className="font-medium text-primary">{rating.toFixed(1)}</span>
            </>
          ) : null}
        </div>
        <h3 className="line-clamp-2 font-display text-base font-semibold text-primary">
          <Link href={href} className="hover:text-secondary">
            {title}
          </Link>
        </h3>
        <p className="mt-3 text-xl font-bold text-primary">
          {formatPrice(price, currency, numberLocale)}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-5">
          <CtaButton
            href={ctaHref}
            label={ctaLabel}
            size="sm"
            showCart
            className="w-full"
          />
          <Link
            href={href}
            className="text-center text-sm font-medium text-secondary hover:underline"
          >
            {readLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
