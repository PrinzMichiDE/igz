import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AwardBadge } from "@/components/comparison/award-badge";
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

  const rows = category.products.map((product, index) => ({
    rank: index + 1,
    title: product.title,
    href: `/${locale}/produkt/${product.slug}`,
    imageUrl: product.imageUrl,
    score: product.editorialScore ?? product.rating,
    price: product.price?.toString(),
    currency: product.currency,
    ctaHref: product.affiliateUrl || product.productUrl || "#",
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          {t("category.comparison")}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
          {article?.title || `${name} ${t("category.comparison")}`}
        </h1>
        <p className="mt-3 max-w-3xl text-zinc-600">
          {article?.excerpt ||
            (locale === "en" ? category.descriptionEn : category.descriptionDe)}
        </p>
      </div>

      <div className="mb-6">
        <AffiliateDisclosure text={t("disclosure.short")} />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {comparison?.winnerProduct ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
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
              ctaLabel={t("cta.amazon")}
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
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
            <AwardBadge type="preisLeistung" label={t("category.priceWinner")} />
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
              ctaLabel={t("cta.amazon")}
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
          <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/40 p-4">
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
              ctaLabel={t("cta.amazon")}
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
        <div className="mb-8 lg:hidden">
          <CtaButton
            href={comparison.winnerProduct.affiliateUrl}
            label={t("category.ctaWinner")}
            className="w-full"
            size="lg"
          />
        </div>
      ) : null}

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold">{t("category.tableTitle")}</h2>
        <ComparisonTable
          rows={rows}
          locale={locale}
          ctaLabel={t("cta.amazon")}
          readLabel={t("category.readReview")}
        />
      </section>

      {content.intro ? (
        <section className="prose-article mb-10 font-serif">
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
  );
}
