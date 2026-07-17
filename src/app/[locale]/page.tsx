import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { CategoryIconCard } from "@/components/layout/category-icon-card";
import { HeroSearch } from "@/components/layout/hero-search";
import { WhyIgzSection } from "@/components/layout/why-igz-section";
import { ProductCard } from "@/components/product/product-card";
import { prisma } from "@/lib/db/prisma";
import { productOutHref } from "@/lib/product-links";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

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
    });
  } catch {
    return [];
  }
}

function pseudoDiscount(seed: string) {
  let total = 0;
  for (const char of seed) total += char.charCodeAt(0);
  return 12 + (total % 18);
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

  return (
    <div>
      <section className="igz-hero-gradient border-b border-border/70">
        <div className="igz-container py-16 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
              {t("site.tagline")}
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-primary md:text-6xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-8">
              <HeroSearch
                placeholder={t("home.searchPlaceholder")}
                buttonLabel={t("home.searchButton")}
                actionHref={`/${locale}#categories`}
              />
            </div>
            <div className="mt-6 flex justify-center">
              <AffiliateDisclosure text={t("home.trust")} compact />
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="igz-container py-16 md:py-20">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold text-primary">
            {t("home.browseCategories")}
          </h2>
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
            href={`/${locale}#reviews`}
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
                ctaHref={productOutHref(product, locale, homePath)}
                readLabel={t("category.readReview")}
                discountPercent={pseudoDiscount(product.slug)}
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
            href={`/${locale}#categories`}
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
                ctaLabel={t("cta.checkPrice")}
                ctaHref={productOutHref(featured, locale, homePath)}
                readLabel={t("category.readReview")}
                variant="featured"
                badge={t("home.editorsChoice")}
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
                  ctaLabel={t("cta.checkPrice")}
                  ctaHref={productOutHref(product, locale, homePath)}
                  readLabel={t("category.readReview")}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
