type MatrixRow = {
  id: string;
  title: string;
  values: boolean[];
};

type Props = {
  title: string;
  featureLabel: string;
  yesLabel: string;
  noLabel: string;
  features: string[];
  rows: MatrixRow[];
};

export function FeatureComparisonMatrix({
  title,
  featureLabel,
  yesLabel,
  noLabel,
  features,
  rows,
}: Props) {
  if (features.length === 0 || rows.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 font-display text-2xl font-semibold text-primary">
        {title}
      </h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted uppercase tracking-wide">
                {featureLabel}
              </th>
              {rows.map((row) => (
                <th
                  key={row.id}
                  className="px-4 py-3 font-semibold text-primary"
                >
                  {row.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {features.map((feature, featureIndex) => (
              <tr key={feature} className="hover:bg-surface-muted/50">
                <td className="px-4 py-3 font-medium text-primary">{feature}</td>
                {rows.map((row) => (
                  <td
                    key={`${row.id}-${feature}`}
                    className="px-4 py-3 text-center"
                  >
                    <span
                      className={
                        row.values[featureIndex]
                          ? "inline-flex rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success"
                          : "inline-flex rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted"
                      }
                    >
                      {row.values[featureIndex] ? yesLabel : noLabel}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
