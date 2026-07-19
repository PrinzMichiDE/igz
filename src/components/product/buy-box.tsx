import Image from "next/image";
import { Star } from "lucide-react";
import { CtaButton } from "@/components/affiliate/cta-button";
import { ScoreBadge } from "@/components/product/score-badge";
import { formatDate, formatPrice } from "@/lib/utils";

type Props = {
  title?: string;
  imageUrl?: string | null;
  score?: number | null;
  scoreLabel: string;
  editorChoiceLabel?: string;
  amazonRating?: number | null;
  amazonReviewCount?: number;
  amazonRatingLabel?: string;
  price?: number | string | null;
  currency?: string;
  locale: string;
  priceNote: string;
  lastSyncedAt?: Date | string | null;
  ctaHref: string;
  ctaLabel: string;
  ctaSublabel?: string;
  imageOverlayLabel?: string;
  amazonHint?: string;
  disclosureInline: string;
};

export function BuyBox({
  title,
  imageUrl,
  score,
  scoreLabel,
  editorChoiceLabel,
  amazonRating,
  amazonReviewCount = 0,
  amazonRatingLabel,
  price,
  currency = "EUR",
  locale,
  priceNote,
  lastSyncedAt,
  ctaHref,
  ctaLabel,
  ctaSublabel,
  imageOverlayLabel,
  amazonHint,
  disclosureInline,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <aside className="igz-card sticky top-24 overflow-hidden">
      {imageUrl ? (
        <a
          href={ctaHref}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="group relative block aspect-[4/3] bg-surface-muted"
          aria-label={imageOverlayLabel || ctaLabel}
        >
          <Image
            src={imageUrl}
            alt={title || ""}
            fill
            className="object-contain p-6 transition group-hover:scale-[1.02]"
            sizes="320px"
            unoptimized
          />
          {imageOverlayLabel ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-amazon-dark/90 to-transparent px-4 py-3 text-center text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
              {imageOverlayLabel}
            </div>
          ) : null}
        </a>
      ) : null}
      <div className="p-5">
        {title ? (
          <h2 className="font-display text-lg font-semibold text-primary">
            {title}
          </h2>
        ) : null}
        <a
          href={ctaHref}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="mt-3 block font-display text-3xl font-bold text-primary transition hover:text-amazon-hover"
        >
          {formatPrice(price, currency, numberLocale)}
        </a>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <ScoreBadge
            score={score}
            size="lg"
            label={scoreLabel}
            showBadge={Boolean(editorChoiceLabel)}
            badgeLabel={editorChoiceLabel}
          />
          {typeof amazonRating === "number" ? (
            <div>
              <div className="flex items-center gap-1 text-amazon">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-semibold text-primary">
                  {amazonRating.toFixed(1)}/5
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                {amazonRatingLabel || "Amazon"}
                {amazonReviewCount > 0
                  ? ` · ${amazonReviewCount.toLocaleString(numberLocale)}`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>
        <p className="mt-4 text-xs text-muted">
          {priceNote}: {formatDate(lastSyncedAt, numberLocale)}
        </p>
        <div className="mt-5">
          <CtaButton
            href={ctaHref}
            label={ctaLabel}
            sublabel={ctaSublabel}
            className="w-full"
            size="lg"
            variant="amazon"
          />
        </div>
        {amazonHint ? (
          <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
            {amazonHint}
          </p>
        ) : null}
        <p className="mt-3 text-center text-[11px] leading-5 text-muted">
          * {disclosureInline}
        </p>
      </div>
    </aside>
  );
}
