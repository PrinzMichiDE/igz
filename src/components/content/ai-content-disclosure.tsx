type Props = {
  title: string;
  body: string;
  legalNote: string;
  methodologyHref?: string;
  methodologyLabel?: string;
  className?: string;
};

/**
 * EU AI Act Art. 50 transparency label for AI-generated text published online.
 * Visible to readers + machine-readable attributes for automated detection.
 */
export function AiContentDisclosure({
  title,
  body,
  legalNote,
  methodologyHref,
  methodologyLabel,
  className,
}: Props) {
  return (
    <aside
      id="ki-kennzeichnung"
      role="note"
      aria-label={title}
      data-ai-generated="true"
      data-ai-generated-content="true"
      data-ai-human-reviewed="false"
      data-ai-disclosure="eu-ai-act-article-50"
      className={
        className ||
        "mt-12 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-4 text-sm text-amber-950 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
      }
    >
      <p className="text-xs font-semibold tracking-[0.14em] text-amber-800 uppercase dark:text-amber-300">
        {title}
      </p>
      <p className="mt-2 leading-6">{body}</p>
      <p className="mt-2 text-xs leading-5 text-amber-900/80 dark:text-amber-200/80">
        {legalNote}
      </p>
      {methodologyHref && methodologyLabel ? (
        <p className="mt-3">
          <a
            href={methodologyHref}
            className="font-semibold text-amber-900 underline-offset-2 hover:underline dark:text-amber-200"
          >
            {methodologyLabel} →
          </a>
        </p>
      ) : null}
    </aside>
  );
}
