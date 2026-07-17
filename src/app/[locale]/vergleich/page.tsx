import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CompareLauncher } from "@/components/comparison/compare-launcher";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { prisma } from "@/lib/db/prisma";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildComparePairSlug } from "@/lib/compare/pair";
import Link from "next/link";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  return buildPageMetadata({
    locale,
    title:
      locale === "en"
        ? "Compare products head-to-head"
        : "Produkte direkt miteinander vergleichen",
    description:
      locale === "en"
        ? "Pick two products and compare scores, price, ratings and AI verdict side by side."
        : "Wähle zwei Produkte und vergleiche Score, Preis, Bewertungen und KI-Fazit direkt.",
    pathWithoutLocale: "/vergleich",
  });
}

export default async function CompareHubPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";

  const products = await prisma.product
    .findMany({
      orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
      take: 40,
      select: { slug: true, title: true },
    })
    .catch(() => []);

  const popularPairs: Array<[string, string]> = [];
  for (let i = 0; i < Math.min(products.length, 4); i += 1) {
    for (let j = i + 1; j < Math.min(products.length, i + 3); j += 1) {
      popularPairs.push([products[i].slug, products[j].slug]);
      if (popularPairs.length >= 6) break;
    }
    if (popularPairs.length >= 6) break;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: t("nav.compare") },
        ]}
      />

      <h1 className="mb-2 text-3xl font-bold tracking-tight">
        {isDe
          ? "Produkte miteinander vergleichen"
          : "Compare products head-to-head"}
      </h1>
      <p className="mb-8 text-zinc-600">
        {isDe
          ? "Direktvergleich mit Score, Preis, Amazon-Rating und optionalem KI-Fazit."
          : "Side-by-side comparison with score, price, Amazon rating and optional AI verdict."}
      </p>

      {products.length < 2 ? (
        <p className="text-sm text-zinc-600">{t("home.empty")}</p>
      ) : (
        <CompareLauncher
          locale={locale}
          options={products}
          labels={{
            title: t("compare.launcherTitle"),
            select: t("compare.select"),
            cta: t("compare.cta"),
            helper: t("compare.helper"),
          }}
        />
      )}

      {popularPairs.length ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">
            {isDe ? "Beliebte Duell-Ideen" : "Popular matchups"}
          </h2>
          <ul className="space-y-2">
            {popularPairs.map(([a, b]) => {
              const pair = buildComparePairSlug(a, b);
              const titleA = products.find((p) => p.slug === a)?.title || a;
              const titleB = products.find((p) => p.slug === b)?.title || b;
              return (
                <li key={pair}>
                  <Link
                    href={`/${locale}/vergleich/${pair}`}
                    className="text-sm font-medium text-blue-700 hover:underline"
                  >
                    {titleA} vs {titleB}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
