import Image from "next/image";
import Link from "next/link";
import { CtaButton } from "@/components/affiliate/cta-button";
import { formatPrice } from "@/lib/utils";
import type {
  ComparableProduct,
  HeadToHeadRow,
} from "@/lib/compare/head-to-head";

type Props = {
  locale: string;
  productA: ComparableProduct;
  productB: ComparableProduct;
  rows: HeadToHeadRow[];
  labels: {
    winner: string;
    tie: string;
    cta: string;
  };
};

function ProductColumn({
  product,
  locale,
  cta,
  numberLocale,
}: {
  product: ComparableProduct;
  locale: string;
  cta: string;
  numberLocale: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="relative mx-auto mb-3 h-28 w-28 overflow-hidden rounded-lg bg-zinc-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain p-2"
            sizes="112px"
            unoptimized
          />
        ) : null}
      </div>
      <h2 className="text-center text-sm font-semibold text-zinc-900">
        <Link
          href={`/${locale}/produkt/${product.slug}`}
          className="hover:text-blue-700"
        >
          {product.title}
        </Link>
      </h2>
      <p className="mt-1 text-center text-sm font-medium text-zinc-700">
        {formatPrice(
          product.price == null ? null : String(product.price),
          product.currency,
          numberLocale,
        )}
      </p>
      <div className="mt-3 flex justify-center">
        <CtaButton
          href={product.affiliateUrl || product.productUrl || "#"}
          label={cta}
          size="sm"
        />
      </div>
    </div>
  );
}

export function HeadToHeadTable({
  locale,
  productA,
  productB,
  rows,
  labels,
}: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ProductColumn
          product={productA}
          locale={locale}
          cta={labels.cta}
          numberLocale={numberLocale}
        />
        <ProductColumn
          product={productB}
          locale={locale}
          cta={labels.cta}
          numberLocale={numberLocale}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-3 items-center gap-2 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0"
          >
            <div
              className={
                row.winner === "a"
                  ? "font-semibold text-emerald-700"
                  : "text-zinc-700"
              }
            >
              {row.key === "price"
                ? formatPrice(row.a === "—" ? null : row.a, productA.currency, numberLocale)
                : row.a}
              {row.winner === "a" ? (
                <div className="text-xs">{labels.winner}</div>
              ) : null}
            </div>
            <div className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {row.label}
              {row.winner === "tie" ? (
                <div className="normal-case text-zinc-400">{labels.tie}</div>
              ) : null}
            </div>
            <div
              className={
                row.winner === "b"
                  ? "text-right font-semibold text-emerald-700"
                  : "text-right text-zinc-700"
              }
            >
              {row.key === "price"
                ? formatPrice(row.b === "—" ? null : row.b, productB.currency, numberLocale)
                : row.b}
              {row.winner === "b" ? (
                <div className="text-xs">{labels.winner}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
