import { Award, BadgeCheck, TrendingUp } from "lucide-react";
import type { ProductTrustSignals } from "@/lib/product-metadata";

type Labels = {
  bestSeller: string;
  amazonChoice: string;
  salesVolume: string;
};

type Props = {
  signals: ProductTrustSignals;
  labels: Labels;
  compact?: boolean;
};

export function AmazonTrustBadges({ signals, labels, compact = false }: Props) {
  const badges = [
    signals.isBestSeller
      ? { key: "best", label: labels.bestSeller, icon: Award }
      : null,
    signals.isAmazonChoice
      ? { key: "choice", label: labels.amazonChoice, icon: BadgeCheck }
      : null,
    signals.salesVolume
      ? { key: "sales", label: signals.salesVolume, icon: TrendingUp }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "mt-3"}`}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/5 px-2.5 py-1 text-[11px] font-semibold text-secondary"
        >
          <badge.icon className="h-3.5 w-3.5" aria-hidden />
          {badge.label}
        </span>
      ))}
    </div>
  );
}
