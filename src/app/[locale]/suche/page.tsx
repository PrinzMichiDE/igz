import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Search } from "lucide-react";
import { HeroSearch } from "@/components/layout/hero-search";
import { ProductCard } from "@/components/product/product-card";
import { productOutHref } from "@/lib/product-links";
import { searchSite } from "@/lib/search";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`../../../../messages/${locale}.json`)).default;
  return {
    title: messages.search.title,
    description: messages.search.subtitle,
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const { q = "" } = await searchParams;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pagePath = `/${locale}/suche`;
  const results = await searchSite(q, locale);

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="max-w-3xl">
        <p className="font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
          {t("search.title")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary">
          {results.query
            ? t("search.resultsFor", { query: results.query })
            : t("search.title")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("search.subtitle")}</p>
      </div>

      <div className="mt-8 max-w-3xl">
        <HeroSearch
          placeholder={t("home.searchPlaceholder")}
          buttonLabel={t("home.searchButton")}
          actionHref={`/${locale}/suche`}
        />
      </div>

      {!results.query ? (
        <p className="mt-10 text-muted-foreground">{t("search.emptyPrompt")}</p>
      ) : (
        <>
          {results.categories.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold text-primary">
                {t("search.categories")}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {results.categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/${locale}/kategorie/${category.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-primary transition hover:border-secondary hover:text-secondary"
                  >
                    <Search className="h-3.5 w-3.5" aria-hidden />
                    {category.name}
                    <span className="text-muted">({category.productCount})</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold text-primary">
              {t("search.products")} ({results.products.length})
            </h2>
            {results.products.length === 0 ? (
              <p className="mt-4 text-muted-foreground">{t("search.noResults")}</p>
            ) : (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {results.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    href={`/${locale}/produkt/${product.slug}`}
                    title={product.title}
                    imageUrl={product.imageUrl}
                    score={product.score}
                    price={product.price}
                    currency={product.currency}
                    locale={locale}
                    ctaLabel={t("cta.amazon")}
                    ctaSublabel={t("cta.amazonSubline")}
                    ctaHref={productOutHref(
                      {
                        asin: product.asin,
                        affiliateUrl: product.affiliateUrl,
                        productUrl: product.productUrl,
                      },
                      locale,
                      pagePath,
                    )}
                    readLabel={t("category.readReview")}
                    amazonOverlayLabel={t("product.imageOverlay")}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
