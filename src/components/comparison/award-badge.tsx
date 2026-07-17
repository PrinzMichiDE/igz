import { cn } from "@/lib/utils";

type Award = "testsieger" | "preisLeistung" | "budget";

const styles: Record<Award, string> = {
  testsieger: "bg-amber-100 text-amber-900 border-amber-300",
  preisLeistung: "bg-emerald-100 text-emerald-900 border-emerald-300",
  budget: "bg-sky-100 text-sky-900 border-sky-300",
};

type Props = {
  type: Award;
  label: string;
};

export function AwardBadge({ type, label }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        styles[type],
      )}
    >
      {label}
    </span>
  );
}
