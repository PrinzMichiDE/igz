type Row = {
  key: string;
  label: string;
  value: string;
  unit?: string | null;
  group?: string | null;
};

type Props = {
  title: string;
  subtitle?: string;
  emptyLabel: string;
  rows: Row[];
  sourceNote?: string | null;
};

export function TechDatasheet({
  title,
  subtitle,
  emptyLabel,
  rows,
  sourceNote,
}: Props) {
  if (rows.length === 0) {
    return (
      <section id="datenblatt" className="mt-10">
        <h2 className="mb-2 font-display text-2xl font-semibold text-primary">
          {title}
        </h2>
        {subtitle ? (
          <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      </section>
    );
  }

  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const group = row.group || "";
    const list = groups.get(group) || [];
    list.push(row);
    groups.set(group, list);
  }

  return (
    <section id="datenblatt" className="mt-10">
      <h2 className="mb-2 font-display text-2xl font-semibold text-primary">
        {title}
      </h2>
      {subtitle ? (
        <p className="mb-4 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}

      <div className="space-y-5">
        {[...groups.entries()].map(([group, groupRows]) => (
          <div key={group || "default"} className="overflow-hidden rounded-xl border border-border bg-surface">
            {group ? (
              <div className="border-b border-border bg-surface-muted px-4 py-2 text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                {group}
              </div>
            ) : null}
            <dl className="divide-y divide-border">
              {groupRows.map((row) => (
                <div
                  key={row.key}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-4"
                >
                  <dt className="text-sm font-medium text-primary">{row.label}</dt>
                  <dd className="text-sm text-muted-foreground">
                    {row.value}
                    {row.unit ? ` ${row.unit}` : ""}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {sourceNote ? (
        <p className="mt-3 text-xs leading-relaxed text-muted">{sourceNote}</p>
      ) : null}
    </section>
  );
}
