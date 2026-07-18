import { CtaButton } from "@/components/affiliate/cta-button";

type Column = {
  key: string;
  label: string;
  group?: string | null;
};

type MatrixRow = {
  id: string;
  title: string;
  ctaHref?: string;
  values: Array<string | null>;
};

type Props = {
  title: string;
  featureLabel: string;
  missingLabel: string;
  ctaLabel: string;
  columns: Column[];
  rows: MatrixRow[];
};

export function SpecComparisonMatrix({
  title,
  featureLabel,
  missingLabel,
  ctaLabel,
  columns,
  rows,
}: Props) {
  if (columns.length === 0 || rows.length === 0) return null;

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
                <th key={row.id} className="px-4 py-3 font-semibold text-primary">
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
            {columns.map((column, columnIndex) => (
              <tr key={column.key} className="hover:bg-surface-muted/50">
                <td className="px-4 py-3 font-medium text-primary">
                  <div>{column.label}</div>
                  {column.group ? (
                    <div className="mt-0.5 text-[11px] text-muted">{column.group}</div>
                  ) : null}
                </td>
                {rows.map((row) => {
                  const value = row.values[columnIndex];
                  return (
                    <td
                      key={`${row.id}-${column.key}`}
                      className="px-4 py-3 text-center text-muted-foreground"
                    >
                      {value ? (
                        <span className="font-medium text-primary">{value}</span>
                      ) : (
                        <span className="text-muted">{missingLabel}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
