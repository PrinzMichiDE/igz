type Props = {
  title: string;
  buyTitle: string;
  skipTitle: string;
  buyIf?: string[];
  skipIf?: string[];
};

export function DecisionGuide({
  title,
  buyTitle,
  skipTitle,
  buyIf = [],
  skipIf = [],
}: Props) {
  if (!buyIf.length && !skipIf.length) return null;

  return (
    <section className="mb-8 grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="mb-1 text-sm font-semibold text-emerald-900">{title}</h2>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-emerald-700">
          {buyTitle}
        </p>
        <ul className="space-y-2 text-sm text-emerald-950">
          {buyIf.map((item) => (
            <li key={item}>✓ {item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <h2 className="mb-1 text-sm font-semibold text-rose-900">{title}</h2>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-rose-700">
          {skipTitle}
        </p>
        <ul className="space-y-2 text-sm text-rose-950">
          {skipIf.map((item) => (
            <li key={item}>✕ {item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
