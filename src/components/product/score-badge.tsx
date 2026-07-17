import { cn } from "@/lib/utils";

type Props = {
  score?: number | null;
  size?: "sm" | "md" | "lg";
  label?: string;
  showBadge?: boolean;
  badgeLabel?: string;
};

export function ScoreBadge({
  score,
  size = "md",
  label,
  showBadge = false,
  badgeLabel,
}: Props) {
  const value =
    typeof score === "number" && Number.isFinite(score)
      ? score.toFixed(1)
      : "—";

  return (
    <div className="inline-flex flex-col items-start gap-2">
      <div
        className={cn(
          "inline-flex flex-col items-center justify-center rounded-xl border-2 border-secondary/30 bg-surface text-primary",
          size === "sm" && "h-12 w-12 text-xs",
          size === "md" && "h-16 w-16 text-sm",
          size === "lg" && "h-24 w-24 text-2xl",
        )}
        title={label}
        aria-label={label ? `${label}: ${value}` : `Score ${value}`}
      >
        <span className="font-display font-bold leading-none">{value}</span>
        {size !== "lg" ? (
          <span className="text-[10px] uppercase tracking-wide text-muted">
            /10
          </span>
        ) : null}
      </div>
      {showBadge && badgeLabel ? (
        <span className="text-sm font-semibold text-secondary">{badgeLabel}</span>
      ) : null}
    </div>
  );
}
