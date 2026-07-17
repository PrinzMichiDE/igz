import Image from "next/image";
import Link from "next/link";
import { ScoreBadge } from "@/components/product/score-badge";
import { CtaButton } from "@/components/affiliate/cta-button";
import { resolveProductImageSrc } from "@/lib/amazon/product-image";
import { formatPrice } from "@/lib/utils";

type Props = {
  href: string;
  title: string;
  productId?: string;
  imageUrl?: string | null;
  imageMimeType?: string | null;
  score?: number | null;
  price?: number | string | null;
  currency?: string;
  locale: string;
  ctaLabel: string;
  ctaHref: string;
  readLabel: string;
};

export function ProductCard({
  href,
  title,
  productId,
  imageUrl,
  imageMimeType,
  score,
  price,
  currency = "EUR",
  locale,
  ctaLabel,
  ctaHref,
  readLabel,
}: Props) {
  const src = resolveProductImageSrc({
    id: productId,
    imageUrl,
    imageMimeType,
  });

  return (
    <article className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-zinc-50">
          {src ? (
            <Image
              src={src}
              alt={title}
              fill
              className="object-contain p-2"
              sizes="96px"
              unoptimized
            />
          ) : null}
        </div>
        <ScoreBadge score={score} />
      </div>
      <h3 className="mb-2 line-clamp-3 text-sm font-semibold text-zinc-900">
        <Link href={href} className="hover:text-blue-700">
          {title}
        </Link>
      </h3>
      <p className="mb-4 text-sm font-medium text-zinc-700">
        {formatPrice(price, currency, locale === "en" ? "en-US" : "de-DE")}
      </p>
      <div className="mt-auto flex flex-col gap-2">
        <CtaButton href={ctaHref} label={ctaLabel} size="sm" />
        <Link
          href={href}
          className="text-center text-sm font-medium text-blue-700 hover:underline"
        >
          {readLabel}
        </Link>
      </div>
    </article>
  );
}
