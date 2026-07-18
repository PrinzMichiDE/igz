type Issue = {
  title: string;
  summary: string;
  severity: "low" | "medium" | "high";
  status?: string | null;
  sources?: Array<{ title?: string | null; url: string }>;
};

type Props = {
  title: string;
  disclaimer: string;
  severityLabels: Record<"low" | "medium" | "high", string>;
  statusLabels: Record<string, string>;
  sourcesLabel: string;
  issues: Issue[];
};

function severityClass(severity: Issue["severity"]) {
  if (severity === "high") return "bg-danger-soft text-danger";
  if (severity === "medium") return "bg-accent/15 text-accent";
  return "bg-surface-muted text-muted-foreground";
}

export function KnownIssuesList({
  title,
  disclaimer,
  severityLabels,
  statusLabels,
  sourcesLabel,
  issues,
}: Props) {
  if (issues.length === 0) return null;

  return (
    <section id="bekannte-fehler" className="mt-10">
      <h2 className="mb-2 font-display text-2xl font-semibold text-primary">
        {title}
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
        {disclaimer}
      </p>

      <div className="space-y-4">
        {issues.map((issue) => (
          <article key={issue.title} className="igz-card p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-primary">{issue.title}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${severityClass(issue.severity)}`}
              >
                {severityLabels[issue.severity]}
              </span>
              {issue.status ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {statusLabels[issue.status] || issue.status}
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {issue.summary}
            </p>
            {issue.sources && issue.sources.length > 0 ? (
              <div className="mt-3">
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                  {sourcesLabel}
                </p>
                <ul className="mt-1 space-y-1">
                  {issue.sources.map((source) => (
                    <li key={source.url}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-secondary hover:underline"
                      >
                        {source.title || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
