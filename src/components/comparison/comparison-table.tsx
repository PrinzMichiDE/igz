import Image from "next/image";
import Link from "next/link";
import { CtaButton } from "@/components/affiliate/cta-button";
import { ScoreBadge } from "@/components/product/score-badge";
import { resolveProductImageSrc } from "@/lib/amazon/product-image";
import { formatPrice } from "@/lib/utils";

export type ComparisonRow = {
  rank: number;
  title: string;
  href: string;
  productId?: string;
  imageUrl?: string | null;
  imageMimeType?: string | null;
  score?: number | null;
  price?: number | string | null;
  currency?: string;
  ctaHref: string;
};

type Props = {
  rows: ComparisonRow[];
  locale: string;
  ctaLabel: string;
  readLabel: string;
};

export function ComparisonTable({ rows, locale, ctaLabel, readLabel }: Props) {
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 lg:block">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">CTA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {rows.map((row) => {
              const imageSrc = resolveProductImageSrc(row);
              return (
                <tr key={row.href}>
                  <td className="px-4 py-3 font-semibold text-zinc-700">
                    {row.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-zinc-50">
                        {imageSrc ? (
                          <Image
                            src={imageSrc}
                            alt=""
                            fill
                            className="object-contain p-1"
                            sizes="48px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div>
                        <Link
                          href={row.href}
                          className="font-medium text-zinc-900 hover:text-blue-700"
                        >
                          {row.title}
                        </Link>
                        <div>
                          <Link
                            href={row.href}
                            className="text-xs text-blue-700 hover:underline"
                          >
                            {readLabel}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={row.score} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(row.price, row.currency || "EUR", numberLocale)}
                  </td>
                  <td className="px-4 py-3">
                    <CtaButton href={row.ctaHref} label={ctaLabel} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {rows.map((row) => {
          const imageSrc = resolveProductImageSrc(row);
          return (
            <article
              key={row.href}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-zinc-500">
                    #{row.rank}
                  </span>
                  <div className="relative h-14 w-14 overflow-hidden rounded-md bg-zinc-50">
                    {imageSrc ? (
                      <Image
                        src={imageSrc}
                        alt=""
                        fill
                        className="object-contain p-1"
                        sizes="56px"
                        unoptimized
                      />
                    ) : null}
                  </div>
                </div>
                <ScoreBadge score={row.score} size="sm" />
              </div>
              <h3 className="mb-2 text-sm font-semibold">
                <Link href={row.href} className="hover:text-blue-700">
                  {row.title}
                </Link>
              </h3>
              <p className="mb-3 text-sm font-medium">
                {formatPrice(row.price, row.currency || "EUR", numberLocale)}
              </p>
              <CtaButton
                href={row.ctaHref}
                label={ctaLabel}
                size="sm"
                className="w-full"
              />
            </article>
          );
        })}
      </div>
    </>
  );
}
