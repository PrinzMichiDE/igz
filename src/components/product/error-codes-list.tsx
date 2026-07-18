type Code = {
  code: string;
  meaning: string;
  steps: string[];
  severity?: "low" | "medium" | "high" | null;
};

type Props = {
  title: string;
  note?: string | null;
  stepsLabel: string;
  severityLabels: Record<"low" | "medium" | "high", string>;
  codes: Code[];
};

export function ErrorCodesList({
  title,
  note,
  stepsLabel,
  severityLabels,
  codes,
}: Props) {
  if (codes.length === 0) return null;

  return (
    <section id="fehlercodes" className="mt-10">
      <h2 className="mb-2 font-display text-2xl font-semibold text-primary">
        {title}
      </h2>
      {note ? (
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{note}</p>
      ) : null}

      <div className="space-y-4">
        {codes.map((entry) => (
          <article key={entry.code} className="igz-card p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-surface-muted px-2 py-1 text-sm font-semibold text-primary">
                {entry.code}
              </code>
              {entry.severity ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {severityLabels[entry.severity]}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {entry.meaning}
            </p>
            {entry.steps.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                  {stepsLabel}
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                  {entry.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
