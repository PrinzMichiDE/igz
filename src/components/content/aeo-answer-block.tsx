type Props = {
  eyebrow: string;
  answer: string;
  takeawaysTitle: string;
  takeaways?: string[];
};

export function AeoAnswerBlock({
  eyebrow,
  answer,
  takeawaysTitle,
  takeaways = [],
}: Props) {
  if (!answer && !takeaways.length) return null;

  return (
    <section className="mb-8 rounded-xl border border-blue-200 bg-blue-50/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {eyebrow}
      </p>
      {answer ? (
        <p className="aeo-direct-answer mt-2 text-base font-medium leading-relaxed text-zinc-900">
          {answer}
        </p>
      ) : null}
      {takeaways.length ? (
        <div className="aeo-key-takeaways mt-4">
          <p className="mb-2 text-sm font-semibold text-zinc-800">
            {takeawaysTitle}
          </p>
          <ul className="space-y-1.5 text-sm text-zinc-700">
            {takeaways.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-blue-600" aria-hidden>
                  ›
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
