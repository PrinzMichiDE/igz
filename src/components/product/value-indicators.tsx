import { Clock3, PiggyBank, TrendingDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Props = {
  price: number | null;
  categoryAveragePrice: number | null;
  savingsPercent: number | null;
  lastSyncedAt?: Date | string | null;
  locale: string;
  labels: {
    belowAverage: string;
    aboveAverage: string;
    onPar: string;
    savings: string;
    updated: string;
  };
};

export function ValueIndicators({
  price,
  categoryAveragePrice,
  savingsPercent,
  lastSyncedAt,
  locale,
  labels,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";
  const items: Array<{ key: string; icon: typeof PiggyBank; text: string }> = [];

  if (
    price !== null &&
    categoryAveragePrice !== null &&
    categoryAveragePrice > 0
  ) {
    const delta = Math.round(
      ((price - categoryAveragePrice) / categoryAveragePrice) * 100,
    );
    if (delta <= -5) {
      items.push({
        key: "below",
        icon: PiggyBank,
        text: labels.belowAverage.replace("{percent}", String(Math.abs(delta))),
      });
    } else if (delta >= 5) {
      items.push({
        key: "above",
        icon: TrendingDown,
        text: labels.aboveAverage.replace("{percent}", String(delta)),
      });
    } else {
      items.push({
        key: "par",
        icon: PiggyBank,
        text: labels.onPar,
      });
    }
  }

  if (typeof savingsPercent === "number" && savingsPercent > 0) {
    items.push({
      key: "savings",
      icon: TrendingDown,
      text: labels.savings.replace("{percent}", String(savingsPercent)),
    });
  }

  if (lastSyncedAt) {
    items.push({
      key: "updated",
      icon: Clock3,
      text: `${labels.updated}: ${formatDate(lastSyncedAt, numberLocale)}`,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.key}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-xs text-muted-foreground"
        >
          <item.icon className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
          {item.text}
        </span>
      ))}
    </div>
  );
}
