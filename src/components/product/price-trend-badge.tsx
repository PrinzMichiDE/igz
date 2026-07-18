import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { PriceTrend } from "@/lib/price-history";

type Props = {
  trend: PriceTrend;
  changePercent: number | null;
  labels: {
    down: string;
    up: string;
    stable: string;
    unknown: string;
  };
};

export function PriceTrendBadge({ trend, changePercent, labels }: Props) {
  if (trend === "unknown") return null;

  const config = {
    down: {
      icon: TrendingDown,
      className: "border-success/30 bg-success-soft text-success",
      text:
        changePercent !== null
          ? labels.down.replace("{percent}", String(Math.abs(changePercent)))
          : labels.down.replace("{percent}", ""),
    },
    up: {
      icon: TrendingUp,
      className: "border-danger/30 bg-danger-soft text-danger",
      text:
        changePercent !== null
          ? labels.up.replace("{percent}", String(changePercent))
          : labels.up.replace("{percent}", ""),
    },
    stable: {
      icon: Minus,
      className: "border-border bg-surface-muted text-muted-foreground",
      text: labels.stable,
    },
    unknown: {
      icon: Minus,
      className: "border-border bg-surface-muted text-muted-foreground",
      text: labels.unknown,
    },
  } as const;

  const item = config[trend];
  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.className}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {item.text}
    </span>
  );
}
