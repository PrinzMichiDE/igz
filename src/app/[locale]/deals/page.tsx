import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { HeroSearch } from "@/components/layout/hero-search";
import { ProductCard } from "@/components/product/product-card";
import { getTopDeals } from "@/lib/deals";
import { productOutHref } from "@/lib/product-links";
import { prisma } from "@/lib/db/prisma";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = (await import(`../../../../messages/${locale}.json`)).default;
  return {
    title: messages.deals.title,
    description: messages.deals.subtitle,
  };
}

export default async function DealsPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pagePath = `/${locale}/deals`;

  const deals = await getTopDeals(locale);

  const productsWithUrls = await prisma.product
    .findMany({
      where: { id: { in: deals.map((deal) => deal.id) } },
      select: { id: true, asin: true, affiliateUrl: true, productUrl: true },
    })
    .catch(() => []);

  const urlById = new Map(productsWithUrls.map((p) => [p.id, p]));

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="max-w-3xl">
        <p className="font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
          {t("deals.badge")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
          {t("deals.title")}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {t("deals.subtitle")}
        </p>
      </div>

      <div className="mt-6">
        <AffiliateDisclosure text={t("disclosure.short")} />
      </div>

      {deals.length === 0 ? (
        <p className="mt-10 text-muted-foreground">{t("deals.empty")}</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {deals.map((deal) => {
            const urls = urlById.get(deal.id);
            const discount =
              deal.savingsPercent > 0
                ? deal.savingsPercent
                : deal.belowAveragePercent;

            return (
              <ProductCard
                key={deal.id}
                href={`/${locale}/produkt/${deal.slug}`}
                title={deal.title}
                imageUrl={deal.imageUrl}
                score={deal.score}
                price={deal.price}
                currency={deal.currency}
                locale={locale}
                ctaLabel={t("cta.buyOnAmazon")}
                ctaSublabel={t("cta.amazonSubline")}
                ctaHref={productOutHref(
                  {
                    asin: urls?.asin ?? deal.id,
                    affiliateUrl: urls?.affiliateUrl,
                    productUrl: urls?.productUrl,
                  },
                  locale,
                  pagePath,
                )}
                readLabel={t("category.readReview")}
                amazonOverlayLabel={t("product.imageOverlay")}
                discountPercent={discount}
              />
            );
          })}
        </div>
      )}

      <section className="mt-16 rounded-xl border border-border bg-surface-muted p-6">
        <h2 className="font-display text-xl font-semibold text-primary">
          {t("deals.searchTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("deals.searchSubtitle")}
        </p>
        <div className="mt-4 max-w-xl">
          <HeroSearch
            placeholder={t("home.searchPlaceholder")}
            buttonLabel={t("home.searchButton")}
            actionHref={`/${locale}/suche`}
          />
        </div>
        <Link
          href={`/${locale}/kategorien`}
          className="mt-4 inline-block text-sm font-semibold text-secondary hover:underline"
        >
          {t("deals.browseCategories")}
        </Link>
      </section>
    </div>
  );
}
