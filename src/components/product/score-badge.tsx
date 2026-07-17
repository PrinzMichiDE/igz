import { cn } from "@/lib/utils";

type Props = {
  score?: number | null;
  size?: "sm" | "md" | "lg";
  label?: string;
};

export function ScoreBadge({ score, size = "md", label }: Props) {
  const value =
    typeof score === "number" && Number.isFinite(score)
      ? score.toFixed(1)
      : "—";

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-950",
        size === "sm" && "h-12 w-12 text-xs",
        size === "md" && "h-16 w-16 text-sm",
        size === "lg" && "h-20 w-20 text-base",
      )}
      title={label}
      aria-label={label ? `${label}: ${value}` : `Score ${value}`}
    >
      <span className="font-bold leading-none">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-amber-700">
        /10
      </span>
    </div>
  );
}
