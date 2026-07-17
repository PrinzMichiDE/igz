import { Check, X } from "lucide-react";

type Props = {
  prosTitle: string;
  consTitle: string;
  pros: string[];
  cons: string[];
};

export function ProsCons({ prosTitle, consTitle, pros, cons }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-success/20 bg-success-soft p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="font-display text-base font-semibold text-primary">
            {prosTitle}
          </h2>
        </div>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {pros.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-danger/20 bg-danger-soft p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/10 text-danger">
            <X className="h-4 w-4" aria-hidden />
          </span>
          <h2 className="font-display text-base font-semibold text-primary">
            {consTitle}
          </h2>
        </div>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {cons.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-danger" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
