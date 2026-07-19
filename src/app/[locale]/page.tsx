import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { CtaButton } from "@/components/affiliate/cta-button";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { CategoryIconCard } from "@/components/layout/category-icon-card";
import { HeroSearch } from "@/components/layout/hero-search";
import { WhyIgzSection } from "@/components/layout/why-igz-section";
import { ProductCard } from "@/components/product/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { productOutHref } from "@/lib/product-links";
import { extractTrustSignals } from "@/lib/product-metadata";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  itemListJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
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
        ? "Independent Amazon product comparisons & reviews"
        : "Unabhängige Amazon-Produktvergleiche & Tests",
    description:
      locale === "en"
        ? "IGZ Compare ranks Amazon bestsellers with editorial scores, side-by-side tables and clear buying advice."
        : "IGZ Vergleich bewertet Amazon-Bestseller mit redaktionellen Scores, Vergleichstabellen und klaren Kaufempfehlungen.",
    pathWithoutLocale: "",
  });
}

async function safeCategories() {
  try {
    return await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { nameDe: "asc" },
    });
  } catch {
    return [];
  }
}

async function safeLatestProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        price: true,
        currency: true,
        editorialScore: true,
        rating: true,
        asin: true,
        affiliateUrl: true,
        productUrl: true,
        rawSearchJson: true,
      },
    });
  } catch {
    return [];
  }
}

function dealDiscount(product: { slug: string; rawSearchJson: unknown; price: { toString(): string } | null }) {
  const signals = extractTrustSignals(
    product.rawSearchJson,
    product.price?.toString(),
  );
  return signals.savingsPercent && signals.savingsPercent > 0
    ? signals.savingsPercent
    : null;
}

export default async function HomePage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [categories, products] = await Promise.all([
    safeCategories(),
    safeLatestProducts(),
  ]);

  const deals = products.slice(0, 4);
  const featured = products[0];
  const topRated = products.slice(1, 4);
  const homePath = `/${locale}`;
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale));
  const aeoAnswer = featured
    ? isDe
      ? `IGZ bewertet Amazon-Produkte redaktionell nach Specs, Preis und Nutzerfeedback. Aktueller Tip: ${featured.title}.`
      : `IGZ ranks Amazon products editorially by specs, price and user feedback. Current pick: ${featured.title}.`
    : isDe
      ? "IGZ liefert unabhängige Amazon-Vergleiche mit klaren Scores, Tabellen und Ratgebern – ohne erfundene Labortests."
      : "IGZ delivers independent Amazon comparisons with clear scores, tables and guides — no invented lab tests.";

  return (
    <div>
      <JsonLd
        data={[
          organizationJsonLd(locale),
          websiteJsonLd(locale),
          categories.length
            ? itemListJsonLd({
                name: isDe ? "IGZ Kategorien" : "IGZ categories",
                url: pageUrl,
                items: categories.slice(0, 12).map((category, index) => ({
                  position: index + 1,
                  name: isDe ? category.nameDe : category.nameEn,
                  url: absoluteUrl(
                    localizedPath(locale, `/kategorie/${category.slug}`),
                  ),
                })),
              })
            : null,
        ]}
      />
      <section className="igz-hero-gradient border-b border-border/70">
        <div className="igz-container py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
              {t("site.tagline")}
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-primary md:text-6xl">
              {t("home.heroTitle")}
            </h1>
            <p className="aeo-direct-answer mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-8">
            <HeroSearch
              placeholder={t("home.searchPlaceholder")}
              buttonLabel={t("home.searchButton")}
              actionHref={`/${locale}/suche`}
            />
            </div>
            <div className="mt-6 flex justify-center">
              <AffiliateDisclosure text={t("home.trust")} compact />
            </div>
            <div className="mx-auto mt-8 max-w-3xl text-left">
              <AeoAnswerBlock
                eyebrow={t("product.directAnswer")}
                answer={aeoAnswer}
                takeawaysTitle={t("product.keyTakeaways")}
                takeaways={
                  isDe
                    ? [
                        "Redaktioneller IGZ-Score statt reiner Sterne-Sortierung",
                        "Vergleichstabellen und Ratgeber für die Kaufentscheidung",
                        "Transparente Methodik und Affiliate-Kennzeichnung",
                      ]
                    : [
                        "Editorial IGZ score instead of star sorting alone",
                        "Comparison tables and guides for buying decisions",
                        "Transparent methodology and affiliate disclosure",
                      ]
                }
              />
            </div>
            {featured ? (
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("home.editorsChoice")}: {featured.title}
                </p>
                <CtaButton
                  href={productOutHref(featured, locale, homePath)}
                  label={t("cta.buyOnAmazon")}
                  sublabel={t("cta.amazonSubline")}
                  variant="amazon"
                  size="lg"
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section id="categories" className="igz-container py-16 md:py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-primary">
            {t("home.browseCategories")}
          </h2>
          <Link
            href={`/${locale}/kategorien`}
            className="mt-3 inline-flex text-sm font-semibold text-secondary hover:underline"
          >
            {t("categoriesPage.title")} →
          </Link>
        </div>
        {categories.length === 0 ? (
          <p className="mt-8 text-center text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {categories.map((category) => (
              <CategoryIconCard
                key={category.id}
                href={`/${locale}/kategorie/${category.slug}`}
                title={locale === "en" ? category.nameEn : category.nameDe}
                slug={category.slug}
                categoryId={category.id}
                imageUrl={category.imageUrl}
                imageMimeType={category.imageMimeType}
              />
            ))}
          </div>
        )}
      </section>

      <section id="deals" className="igz-container py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-primary">
            {t("home.topDeals")}
          </h2>
          <Link
            href={`/${locale}/deals`}
            className="text-sm font-semibold text-secondary hover:underline"
          >
            {t("home.viewAllDeals")}
          </Link>
        </div>
        {deals.length === 0 ? (
          <p className="text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {deals.map((product) => (
              <ProductCard
                key={product.id}
                href={`/${locale}/produkt/${product.slug}`}
                title={product.title}
                imageUrl={product.imageUrl}
                score={product.editorialScore ?? product.rating}
                price={product.price?.toString()}
                currency={product.currency}
                locale={locale}
                ctaLabel={t("cta.buy")}
                ctaSublabel={t("cta.amazonSubline")}
                ctaHref={productOutHref(product, locale, homePath)}
                readLabel={t("category.readReview")}
                amazonOverlayLabel={t("product.imageOverlay")}
                discountPercent={dealDiscount(product) ?? undefined}
              />
            ))}
          </div>
        )}
      </section>

      <WhyIgzSection />

      <section id="reviews" className="igz-container py-16 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl font-semibold text-primary">
            {t("home.topRated")}
          </h2>
          <Link
            href={`/${locale}/kategorien`}
            className="text-sm font-semibold text-secondary hover:underline"
          >
            {t("home.viewAllReports")}
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="space-y-5">
            {featured ? (
              <ProductCard
                href={`/${locale}/produkt/${featured.slug}`}
                title={featured.title}
                imageUrl={featured.imageUrl}
                score={featured.editorialScore ?? featured.rating}
                price={featured.price?.toString()}
                currency={featured.currency}
                locale={locale}
                ctaLabel={t("cta.buyOnAmazon")}
                ctaSublabel={t("cta.amazonSubline")}
                ctaHref={productOutHref(featured, locale, homePath)}
                readLabel={t("category.readReview")}
                variant="featured"
                badge={t("home.editorsChoice")}
                amazonOverlayLabel={t("product.imageOverlay")}
              />
            ) : null}
            <div className="grid gap-5 lg:grid-cols-3">
              {topRated.map((product) => (
                <ProductCard
                  key={product.id}
                  href={`/${locale}/produkt/${product.slug}`}
                  title={product.title}
                  imageUrl={product.imageUrl}
                  score={product.editorialScore ?? product.rating}
                  price={product.price?.toString()}
                  currency={product.currency}
                  locale={locale}
                  ctaLabel={t("cta.amazon")}
                  ctaSublabel={t("cta.amazonSubline")}
                  ctaHref={productOutHref(product, locale, homePath)}
                  readLabel={t("category.readReview")}
                  amazonOverlayLabel={t("product.imageOverlay")}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
