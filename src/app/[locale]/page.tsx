import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { CategoryCard } from "@/components/layout/category-card";
import { ProductCard } from "@/components/product/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  const t = await getTranslations({ locale });

  return buildPageMetadata({
    locale,
    title: t("seo.homeTitle"),
    description: t("seo.homeDescription"),
    pathWithoutLocale: "",
  });
}

async function safeCategories() {
  try {
    return await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        products: {
          orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
          take: 1,
        },
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
      take: 6,
    });
  } catch {
    return [];
  }
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

  const winners = products.slice(0, 3);

  return (
    <div>
      <JsonLd data={[organizationJsonLd(locale), websiteJsonLd(locale)]} />

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">
            {t("site.tagline")}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            {t("home.heroTitle")}
          </h1>
          <p className="aeo-direct-answer mt-4 max-w-2xl text-lg text-zinc-600">
            {t("home.heroSubtitle")}
          </p>
          <div className="mt-6">
            <AffiliateDisclosure text={t("home.trust")} compact />
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-zinc-900">
          {t("home.topCategories")}
        </h2>
        {categories.length === 0 ? (
          <p className="text-zinc-600">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                href={`/${locale}/kategorie/${category.slug}`}
                title={locale === "en" ? category.nameEn : category.nameDe}
                description={
                  locale === "en"
                    ? category.descriptionEn
                    : category.descriptionDe
                }
                count={category._count.products}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-zinc-900">
          {t("home.latestReviews")}
        </h2>
        {products.length === 0 ? (
          <p className="text-zinc-600">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                href={`/${locale}/produkt/${product.slug}`}
                title={product.title}
                productId={product.id}
                imageUrl={product.imageUrl}
                imageMimeType={product.imageMimeType}
                score={product.editorialScore ?? product.rating}
                price={product.price?.toString()}
                currency={product.currency}
                locale={locale}
                ctaLabel={t("cta.amazon")}
                ctaHref={product.affiliateUrl || product.productUrl || "#"}
                readLabel={t("category.readReview")}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-zinc-900">
          {t("home.winners")}
        </h2>
        {winners.length === 0 ? (
          <p className="text-zinc-600">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {winners.map((product) => (
              <ProductCard
                key={product.id}
                href={`/${locale}/produkt/${product.slug}`}
                title={product.title}
                productId={product.id}
                imageUrl={product.imageUrl}
                imageMimeType={product.imageMimeType}
                score={product.editorialScore ?? product.rating}
                price={product.price?.toString()}
                currency={product.currency}
                locale={locale}
                ctaLabel={t("cta.amazon")}
                ctaHref={product.affiliateUrl || product.productUrl || "#"}
                readLabel={t("category.readReview")}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
