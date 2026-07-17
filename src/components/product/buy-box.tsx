import { CtaButton } from "@/components/affiliate/cta-button";
import { ScoreBadge } from "@/components/product/score-badge";
import { formatDate, formatPrice } from "@/lib/utils";

type Props = {
  score?: number | null;
  scoreLabel: string;
  price?: number | string | null;
  currency?: string;
  locale: string;
  priceNote: string;
  lastSyncedAt?: Date | string | null;
  ctaHref: string;
  ctaLabel: string;
  disclosureInline: string;
};

export function BuyBox({
  score,
  scoreLabel,
  price,
  currency = "EUR",
  locale,
  priceNote,
  lastSyncedAt,
  ctaHref,
  ctaLabel,
  disclosureInline,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <aside className="sticky top-24 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {scoreLabel}
          </p>
          <p className="text-2xl font-bold text-zinc-900">
            {formatPrice(price, currency, numberLocale)}
          </p>
        </div>
        <ScoreBadge score={score} size="lg" label={scoreLabel} />
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        {priceNote}: {formatDate(lastSyncedAt, numberLocale)}
      </p>
      <CtaButton href={ctaHref} label={ctaLabel} className="w-full" size="lg" />
      <p className="mt-2 text-center text-[11px] text-zinc-500">
        * {disclosureInline}
      </p>
    </aside>
  );
}
