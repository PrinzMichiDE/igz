import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AwardBadge } from "@/components/comparison/award-badge";
import { CategoryFilterSidebar } from "@/components/comparison/category-filter-sidebar";
import { ComparisonTable } from "@/components/comparison/comparison-table";
import { CtaButton } from "@/components/affiliate/cta-button";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductCard } from "@/components/product/product-card";
import { prisma } from "@/lib/db/prisma";
import { asComparisonContent } from "@/lib/content-types";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const category = await prisma.category
    .findUnique({
      where: { slug },
      include: {
        products: {
          orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
        },
        comparisons: {
          include: {
            winnerProduct: true,
            priceWinner: true,
            budgetWinner: true,
          },
        },
        articles: {
          where: { type: "comparison", locale, status: "published" },
          take: 1,
        },
      },
    })
    .catch(() => null);

  if (!category) notFound();

  const comparison = category.comparisons[0];
  const article = category.articles[0];
  const content = asComparisonContent(article?.contentJson ?? comparison?.criteriaJson);
  const name = locale === "en" ? category.nameEn : category.nameDe;
  const description =
    article?.excerpt ||
    (locale === "en" ? category.descriptionEn : category.descriptionDe);

  const rows = category.products.map((product, index) => ({
    rank: index + 1,
    title: product.title,
    href: `/${locale}/produkt/${product.slug}`,
    imageUrl: product.imageUrl,
    score: product.editorialScore ?? product.rating,
    price: product.price?.toString(),
    currency: product.currency,
    ctaHref: product.affiliateUrl || product.productUrl || "#",
    excerpt: description,
    badge:
      comparison?.winnerProductId === product.id
        ? t("category.winner")
        : comparison?.priceWinnerId === product.id
          ? t("category.priceWinner")
          : null,
  }));

  return (
    <div className="igz-container py-10 md:py-14">
      <nav className="text-sm text-muted">
        <Link href={`/${locale}`} className="hover:text-secondary">
          {t("nav.home")}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-primary">{name}</span>
      </nav>

      <div className="mt-6 max-w-4xl">
        <p className="font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
          {t("category.comparison")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
          {article?.title || `${name} ${t("category.comparison")}`}
        </h1>
        {description ? (
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-6">
        <AffiliateDisclosure text={t("disclosure.short")} />
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
        <CategoryFilterSidebar locale={locale} />

        <div>
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            {comparison?.winnerProduct ? (
              <div className="space-y-3 rounded-xl border border-secondary/20 bg-secondary/5 p-4">
                <AwardBadge type="testsieger" label={t("category.winner")} />
                <ProductCard
                  href={`/${locale}/produkt/${comparison.winnerProduct.slug}`}
                  title={comparison.winnerProduct.title}
                  imageUrl={comparison.winnerProduct.imageUrl}
                  score={
                    comparison.winnerProduct.editorialScore ??
                    comparison.winnerProduct.rating
                  }
                  price={comparison.winnerProduct.price?.toString()}
                  currency={comparison.winnerProduct.currency}
                  locale={locale}
                  ctaLabel={t("cta.checkPrice")}
                  ctaHref={
                    comparison.winnerProduct.affiliateUrl ||
                    comparison.winnerProduct.productUrl ||
                    "#"
                  }
                  readLabel={t("category.readReview")}
                />
              </div>
            ) : null}
            {comparison?.priceWinner ? (
              <div className="space-y-3 rounded-xl border border-success/20 bg-success-soft p-4">
                <AwardBadge
                  type="preisLeistung"
                  label={t("category.priceWinner")}
                />
                <ProductCard
                  href={`/${locale}/produkt/${comparison.priceWinner.slug}`}
                  title={comparison.priceWinner.title}
                  imageUrl={comparison.priceWinner.imageUrl}
                  score={
                    comparison.priceWinner.editorialScore ??
                    comparison.priceWinner.rating
                  }
                  price={comparison.priceWinner.price?.toString()}
                  currency={comparison.priceWinner.currency}
                  locale={locale}
                  ctaLabel={t("cta.checkPrice")}
                  ctaHref={
                    comparison.priceWinner.affiliateUrl ||
                    comparison.priceWinner.productUrl ||
                    "#"
                  }
                  readLabel={t("category.readReview")}
                />
              </div>
            ) : null}
            {comparison?.budgetWinner ? (
              <div className="space-y-3 rounded-xl border border-accent/30 bg-amber-50 p-4">
                <AwardBadge type="budget" label={t("category.budgetWinner")} />
                <ProductCard
                  href={`/${locale}/produkt/${comparison.budgetWinner.slug}`}
                  title={comparison.budgetWinner.title}
                  imageUrl={comparison.budgetWinner.imageUrl}
                  score={
                    comparison.budgetWinner.editorialScore ??
                    comparison.budgetWinner.rating
                  }
                  price={comparison.budgetWinner.price?.toString()}
                  currency={comparison.budgetWinner.currency}
                  locale={locale}
                  ctaLabel={t("cta.checkPrice")}
                  ctaHref={
                    comparison.budgetWinner.affiliateUrl ||
                    comparison.budgetWinner.productUrl ||
                    "#"
                  }
                  readLabel={t("category.readReview")}
                />
              </div>
            ) : null}
          </div>

          {comparison?.winnerProduct?.affiliateUrl ? (
            <div className="mb-8 xl:hidden">
              <CtaButton
                href={comparison.winnerProduct.affiliateUrl}
                label={t("category.ctaWinner")}
                className="w-full"
                size="lg"
              />
            </div>
          ) : null}

          <section className="mb-10">
            <h2 className="mb-4 font-display text-2xl font-semibold text-primary">
              {t("category.tableTitle")}
            </h2>
            <ComparisonTable
              rows={rows}
              locale={locale}
              ctaLabel={t("cta.checkPrice")}
              readLabel={t("category.readReview")}
              availableOnAmazonLabel={t("category.availableOnAmazon")}
              columns={{
                model: t("category.columnModel"),
                specs: t("category.columnSpecs"),
                priceAction: t("category.columnPriceAction"),
              }}
            />
          </section>

          {content.intro ? (
            <section className="prose-article mb-10">
              <p>{content.intro}</p>
              {content.rankingNotes?.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </section>
          ) : null}

          <section>
            <FaqAccordion items={content.faq || []} />
          </section>
        </div>
      </div>
    </div>
  );
}
