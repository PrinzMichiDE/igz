import { cn } from "@/lib/utils";

type Award = "testsieger" | "preisLeistung" | "budget";

const styles: Record<Award, string> = {
  testsieger: "border-secondary/20 bg-secondary/5 text-secondary",
  preisLeistung: "border-success/20 bg-success-soft text-success",
  budget: "border-accent/30 bg-amber-50 text-amber-800",
};

type Props = {
  type: Award;
  label: string;
};

export function AwardBadge({ type, label }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase",
        styles[type],
      )}
    >
      {label}
    </span>
  );
}
