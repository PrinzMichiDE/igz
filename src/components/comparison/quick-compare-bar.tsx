import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Item = {
  label: string;
  title: string;
  href: string;
  score?: number | null;
  price?: number | string | null;
  currency?: string;
};

type Props = {
  title: string;
  locale: string;
  items: Item[];
};

export function QuickCompareBar({ title, locale, items }: Props) {
  if (!items.length) return null;
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  return (
    <section className="mb-8 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800">
        {title}
      </div>
      <div className="grid gap-0 md:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href + item.label}
            href={item.href}
            className="border-t border-zinc-100 p-4 transition hover:bg-blue-50/40 md:border-l md:border-t-0 md:first:border-l-0"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              {item.label}
            </p>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-zinc-900">
              {item.title}
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              Score {item.score?.toFixed?.(1) ?? item.score ?? "—"} ·{" "}
              {formatPrice(item.price, item.currency || "EUR", numberLocale)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
