import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryCard } from "@/components/layout/category-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import { BLUETOOTH_HEADPHONES_PAGES } from "@/lib/seo/niche/bluetooth-headphones";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
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
        ? "Best Amazon product lists & comparisons"
        : "Amazon Bestenlisten & Produktvergleiche",
    description:
      locale === "en"
        ? "Browse category best lists with winners, value picks and budget tips."
        : "Bestenlisten nach Kategorie mit Testsieger, Preis-Leistungs-Tipp und Budget-Empfehlung.",
    pathWithoutLocale: "/bestenlisten",
  });
}

export default async function BestListsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, "/bestenlisten"));

  const categories = await prisma.category
    .findMany({
      include: {
        _count: { select: { products: true } },
        comparisons: {
          include: { winnerProduct: true },
        },
      },
      orderBy: { nameDe: "asc" },
    })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Bestenlisten" : "Best lists",
              url: pageUrl,
            },
          ]),
          itemListJsonLd({
            name: isDe ? "Amazon Bestenlisten" : "Amazon best lists",
            url: pageUrl,
            items: categories.map((category, index) => ({
              position: index + 1,
              name: locale === "en" ? category.nameEn : category.nameDe,
              url: absoluteUrl(
                localizedPath(locale, `/kategorie/${category.slug}`),
              ),
            })),
          }),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: isDe ? "Bestenlisten" : "Best lists" },
        ]}
      />

      <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
        {isDe
          ? "Amazon Bestenlisten & Vergleiche"
          : "Amazon best lists & comparisons"}
      </h1>
      <p className="aeo-direct-answer mb-8 max-w-3xl text-lg text-zinc-700">
        {isDe
          ? "Hier findest du unsere aktuellen Kategorie-Vergleiche mit Testsieger, Preis-Leistungs- und Budget-Tipp – optimiert für schnelle Antworten in Suche und KI-Assistenten."
          : "Find our latest category comparisons with overall winners, best value and budget picks — optimized for fast answers in search and AI assistants."}
      </p>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900">
          {isDe
            ? "Fokus-Nische: Bluetooth-Kopfhörer (10 Ranking-Seiten)"
            : "Focus niche: Bluetooth headphones (10 ranking pages)"}
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {BLUETOOTH_HEADPHONES_PAGES.map((page) => (
            <Link
              key={page.id}
              href={`/${locale}${page.path}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                #{page.priority} · {page.kind}
              </p>
              <h3 className="mt-1 text-base font-semibold text-zinc-900">
                {isDe ? page.h1De : page.h1En}
              </h3>
              <p className="mt-2 text-xs text-zinc-500">
                {isDe ? page.primaryKeywordDe : page.primaryKeywordEn}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-zinc-900">
          {isDe ? "Alle Kategorien" : "All categories"}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const name = locale === "en" ? category.nameEn : category.nameDe;
            const winner = category.comparisons[0]?.winnerProduct;
            return (
              <article key={category.id} className="space-y-3">
                <CategoryCard
                  href={`/${locale}/kategorie/${category.slug}`}
                  title={isDe ? `Beste ${name}` : `Best ${name}`}
                  description={
                    locale === "en"
                      ? category.descriptionEn
                      : category.descriptionDe
                  }
                  count={category._count.products}
                  countLabel={
                    isDe ? "Produkte im Vergleich" : "products compared"
                  }
                  slug={category.slug}
                  categoryId={category.id}
                  imageUrl={category.imageUrl}
                  imageMimeType={category.imageMimeType}
                />
                {winner ? (
                  <p className="px-1 text-sm text-zinc-800">
                    <span className="font-semibold">
                      {isDe ? "Testsieger:" : "Winner:"}
                    </span>{" "}
                    <Link
                      href={`/${locale}/produkt/${winner.slug}`}
                      className="text-blue-700 hover:underline"
                    >
                      {winner.title}
                    </Link>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
