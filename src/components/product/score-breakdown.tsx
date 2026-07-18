type Breakdown = {
  value?: number;
  quality?: number;
  usability?: number;
  longevity?: number;
  overall?: number;
};

type Props = {
  title: string;
  labels: {
    value: string;
    quality: string;
    usability: string;
    longevity: string;
    overall: string;
  };
  breakdown?: Breakdown | null;
};

function Bar({ label, value }: { label: string; value?: number }) {
  if (typeof value !== "number") return null;
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-zinc-700">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100">
        <div
          className="h-2 rounded-full bg-amber-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ScoreBreakdown({ title, labels, breakdown }: Props) {
  if (!breakdown) return null;

  return (
    <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-zinc-900">{title}</h2>
      <div className="space-y-3">
        <Bar label={labels.overall} value={breakdown.overall} />
        <Bar label={labels.value} value={breakdown.value} />
        <Bar label={labels.quality} value={breakdown.quality} />
        <Bar label={labels.usability} value={breakdown.usability} />
        <Bar label={labels.longevity} value={breakdown.longevity} />
      </div>
    </section>
  );
}
