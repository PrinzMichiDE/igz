import { CtaButton } from "@/components/affiliate/cta-button";

type Props = {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  ctaSublabel?: string;
  priceLabel?: string;
};

export function AmazonInlineCta({
  title,
  body,
  ctaHref,
  ctaLabel,
  ctaSublabel,
  priceLabel,
}: Props) {
  return (
    <aside className="my-8 overflow-hidden rounded-xl border border-amazon/30 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-bold tracking-[0.14em] text-amazon-dark uppercase">
            Amazon
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-primary">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
          {priceLabel ? (
            <p className="mt-3 font-display text-2xl font-bold text-primary">
              {priceLabel}
            </p>
          ) : null}
        </div>
        <CtaButton
          href={ctaHref}
          label={ctaLabel}
          sublabel={ctaSublabel}
          variant="amazon"
          size="lg"
          className="w-full shrink-0 md:w-auto"
        />
      </div>
    </aside>
  );
}
