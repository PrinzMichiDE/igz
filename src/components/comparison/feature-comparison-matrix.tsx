import { CtaButton } from "@/components/affiliate/cta-button";

type MatrixRow = {
  id: string;
  title: string;
  ctaHref?: string;
  values: boolean[];
};

type Props = {
  title: string;
  featureLabel: string;
  yesLabel: string;
  noLabel: string;
  ctaLabel: string;
  features: string[];
  rows: MatrixRow[];
};

export function FeatureComparisonMatrix({
  title,
  featureLabel,
  yesLabel,
  noLabel,
  ctaLabel,
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
              <th className="px-4 py-3 font-semibold tracking-wide text-muted uppercase">
                {featureLabel}
              </th>
              {rows.map((row) => (
                <th
                  key={row.id}
                  className="px-4 py-3 font-semibold text-primary"
                >
                  <div className="space-y-2">
                    {row.ctaHref ? (
                      <a
                        href={row.ctaHref}
                        target="_blank"
                        rel="nofollow sponsored noopener noreferrer"
                        className="block hover:text-amazon-hover"
                      >
                        {row.title}
                      </a>
                    ) : (
                      row.title
                    )}
                    {row.ctaHref ? (
                      <CtaButton
                        href={row.ctaHref}
                        label={ctaLabel}
                        size="sm"
                        variant="amazon"
                        className="w-full"
                      />
                    ) : null}
                  </div>
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
