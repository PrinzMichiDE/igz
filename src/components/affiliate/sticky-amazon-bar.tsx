"use client";

import { useEffect, useState } from "react";
import { CtaButton } from "@/components/affiliate/cta-button";
import { formatPrice } from "@/lib/utils";

type Props = {
  title: string;
  price?: number | string | null;
  currency?: string;
  locale: string;
  ctaHref: string;
  ctaLabel: string;
  ctaSublabel?: string;
};

export function StickyAmazonBar({
  title,
  price,
  currency = "EUR",
  locale,
  ctaHref,
  ctaLabel,
  ctaSublabel,
}: Props) {
  const [visible, setVisible] = useState(false);
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 420);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur transition-transform duration-300 xl:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      role="complementary"
      aria-label={ctaLabel}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-primary">{title}</p>
          <p className="text-lg font-bold text-primary">
            {formatPrice(price, currency, numberLocale)}
          </p>
        </div>
        <CtaButton
          href={ctaHref}
          label={ctaLabel}
          sublabel={ctaSublabel}
          variant="amazon"
          size="md"
          className="shrink-0"
        />
      </div>
    </div>
  );
}
