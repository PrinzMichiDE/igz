type Props = {
  prosTitle: string;
  consTitle: string;
  pros: string[];
  cons: string[];
};

export function ProsCons({ prosTitle, consTitle, pros, cons }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-emerald-900">
          {prosTitle}
        </h2>
        <ul className="space-y-2 text-sm text-emerald-950">
          {pros.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden>+</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-rose-900">{consTitle}</h2>
        <ul className="space-y-2 text-sm text-rose-950">
          {cons.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden>−</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
