import Image from "next/image";
import { CtaButton } from "@/components/affiliate/cta-button";
import { ScoreBadge } from "@/components/product/score-badge";
import { formatDate, formatPrice } from "@/lib/utils";

type Props = {
  title?: string;
  imageUrl?: string | null;
  score?: number | null;
  scoreLabel: string;
  editorChoiceLabel?: string;
  price?: number | string | null;
  currency?: string;
  locale: string;
  priceNote: string;
  lastSyncedAt?: Date | string | null;
  ctaHref: string;
  ctaLabel: string;
  compareLabel?: string;
  disclosureInline: string;
};

export function BuyBox({
  title,
  imageUrl,
  score,
  scoreLabel,
  editorChoiceLabel,
  price,
  currency = "EUR",
  locale,
  priceNote,
  lastSyncedAt,
  ctaHref,
  ctaLabel,
  compareLabel,
  disclosureInline,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <aside className="igz-card sticky top-24 overflow-hidden">
      {imageUrl ? (
        <div className="relative aspect-[4/3] bg-surface-muted">
          <Image
            src={imageUrl}
            alt={title || ""}
            fill
            className="object-contain p-6"
            sizes="320px"
            unoptimized
          />
        </div>
      ) : null}
      <div className="p-5">
        {title ? (
          <h2 className="font-display text-lg font-semibold text-primary">
            {title}
          </h2>
        ) : null}
        <p className="mt-3 font-display text-3xl font-bold text-primary">
          {formatPrice(price, currency, numberLocale)}
        </p>
        <div className="mt-5 flex items-center gap-4">
          <ScoreBadge
            score={score}
            size="lg"
            label={scoreLabel}
            showBadge={Boolean(editorChoiceLabel)}
            badgeLabel={editorChoiceLabel}
          />
        </div>
        <p className="mt-4 text-xs text-muted">
          {priceNote}: {formatDate(lastSyncedAt, numberLocale)}
        </p>
        <div className="mt-5 space-y-3">
          <CtaButton href={ctaHref} label={ctaLabel} className="w-full" size="lg" />
          {compareLabel ? (
            <button
              type="button"
              className="w-full rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm font-semibold text-secondary"
            >
              {compareLabel}
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-center text-[11px] leading-5 text-muted">
          * {disclosureInline}
        </p>
      </div>
    </aside>
  );
}
