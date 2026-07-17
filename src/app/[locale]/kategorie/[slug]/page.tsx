import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AwardBadge } from "@/components/comparison/award-badge";
import { AwardPicker } from "@/components/comparison/award-picker";
import { CategoryFilterSidebar } from "@/components/comparison/category-filter-sidebar";
import { ComparisonTable } from "@/components/comparison/comparison-table";
import { FeatureComparisonMatrix } from "@/components/comparison/feature-comparison-matrix";
import { ProductMatchFinder } from "@/components/comparison/product-match-finder";
import { CtaButton } from "@/components/affiliate/cta-button";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductCard } from "@/components/product/product-card";
import { prisma } from "@/lib/db/prisma";
import { asComparisonContent, asReviewContent } from "@/lib/content-types";
import { buildFeatureMatrix } from "@/lib/product-ranking";
import { collectFeatureList } from "@/lib/product-metadata";
import { numericPrice, productOutHref } from "@/lib/product-links";
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
  const pagePath = `/${locale}/kategorie/${slug}`;

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

  const reviewArticles = await prisma.article
    .findMany({
      where: {
        productId: { in: category.products.map((product) => product.id) },
        type: "review",
        locale,
        status: "published",
      },
    })
    .catch(() => []);

  const reviewContentByProductId = new Map(
    reviewArticles.map((article) => [
      article.productId,
      asReviewContent(article.contentJson),
    ]),
  );

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
    ctaHref: productOutHref(product, locale, pagePath),
    excerpt: description,
    badge:
      comparison?.winnerProductId === product.id
        ? t("category.winner")
        : comparison?.priceWinnerId === product.id
          ? t("category.priceWinner")
          : null,
  }));

  const matchCandidates = category.products.map((product) => {
    const review = reviewContentByProductId.get(product.id);
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      href: `/${locale}/produkt/${product.slug}`,
      imageUrl: product.imageUrl,
      price: numericPrice(product.price),
      currency: product.currency,
      score: product.editorialScore ?? null,
      rating: product.rating ?? null,
      bestFor: review?.bestFor ?? [],
      notFor: review?.notFor ?? [],
      ctaHref: productOutHref(product, locale, pagePath),
    };
  });

  const featureMatrix = buildFeatureMatrix(
    category.products.map((product) => ({
      id: product.id,
      title: product.title,
      features: collectFeatureList(product.features),
      ctaHref: productOutHref(product, locale, pagePath),
    })),
  );

  const awardOptions = [
    comparison?.winnerProduct
      ? {
          key: "winner" as const,
          badgeType: "testsieger" as const,
          label: t("category.winner"),
          title: comparison.winnerProduct.title,
          reason: t("category.awardReasonWinner"),
          price: comparison.winnerProduct.price?.toString(),
          currency: comparison.winnerProduct.currency,
          href: `/${locale}/produkt/${comparison.winnerProduct.slug}`,
          ctaHref: productOutHref(comparison.winnerProduct, locale, pagePath),
        }
      : null,
    comparison?.priceWinner
      ? {
          key: "price" as const,
          badgeType: "preisLeistung" as const,
          label: t("category.priceWinner"),
          title: comparison.priceWinner.title,
          reason: t("category.awardReasonPrice"),
          price: comparison.priceWinner.price?.toString(),
          currency: comparison.priceWinner.currency,
          href: `/${locale}/produkt/${comparison.priceWinner.slug}`,
          ctaHref: productOutHref(comparison.priceWinner, locale, pagePath),
        }
      : null,
    comparison?.budgetWinner
      ? {
          key: "budget" as const,
          badgeType: "budget" as const,
          label: t("category.budgetWinner"),
          title: comparison.budgetWinner.title,
          reason: t("category.awardReasonBudget"),
          price: comparison.budgetWinner.price?.toString(),
          currency: comparison.budgetWinner.currency,
          href: `/${locale}/produkt/${comparison.budgetWinner.slug}`,
          ctaHref: productOutHref(comparison.budgetWinner, locale, pagePath),
        }
      : null,
  ].filter((option): option is NonNullable<typeof option> => option !== null);

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

      <div className="mt-10">
        <ProductMatchFinder
          candidates={matchCandidates}
          locale={locale}
          labels={{
            title: t("category.matchFinderTitle"),
            subtitle: t("category.matchFinderSubtitle"),
            budget: t("category.matchBudget"),
            priority: t("category.matchPriority"),
            priorityScore: t("category.matchPriorityScore"),
            priorityPrice: t("category.matchPriorityPrice"),
            priorityRating: t("category.matchPriorityRating"),
            useCase: t("category.matchUseCase"),
            useCasePlaceholder: t("category.matchUseCasePlaceholder"),
            submit: t("category.matchSubmit"),
            resultTitle: t("category.matchResultTitle"),
            resultEmpty: t("category.matchResultEmpty"),
            readReview: t("category.readReview"),
            ctaLabel: t("cta.amazon"),
            ctaSublabel: t("cta.amazonSubline"),
          }}
        />
      </div>

      {awardOptions.length > 0 ? (
        <AwardPicker
          options={awardOptions}
          locale={locale}
          labels={{
            title: t("category.awardPickerTitle"),
            subtitle: t("category.awardPickerSubtitle"),
            ctaLabel: t("cta.buyOnAmazon"),
            ctaSublabel: t("cta.amazonSubline"),
            readReview: t("category.readReview"),
          }}
        />
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[280px_minmax(0,1fr)]">
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
                  ctaLabel={t("cta.buyOnAmazon")}
                  ctaSublabel={t("cta.amazonSubline")}
                  ctaHref={productOutHref(
                    comparison.winnerProduct,
                    locale,
                    pagePath,
                  )}
                  readLabel={t("category.readReview")}
                  amazonOverlayLabel={t("product.imageOverlay")}
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
                  ctaLabel={t("cta.amazon")}
                  ctaSublabel={t("cta.amazonSubline")}
                  ctaHref={productOutHref(
                    comparison.priceWinner,
                    locale,
                    pagePath,
                  )}
                  readLabel={t("category.readReview")}
                  amazonOverlayLabel={t("product.imageOverlay")}
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
                  ctaLabel={t("cta.amazon")}
                  ctaSublabel={t("cta.amazonSubline")}
                  ctaHref={productOutHref(
                    comparison.budgetWinner,
                    locale,
                    pagePath,
                  )}
                  readLabel={t("category.readReview")}
                  amazonOverlayLabel={t("product.imageOverlay")}
                />
              </div>
            ) : null}
          </div>

          {comparison?.winnerProduct ? (
            <div className="mb-8">
              <CtaButton
                href={productOutHref(comparison.winnerProduct, locale, pagePath)}
                label={t("category.ctaWinner")}
                sublabel={t("cta.amazonSubline")}
                className="w-full"
                size="lg"
                variant="amazon"
              />
            </div>
          ) : null}

          <FeatureComparisonMatrix
            title={t("category.featureMatrixTitle")}
            featureLabel={t("category.featureColumn")}
            yesLabel={t("category.featureYes")}
            noLabel={t("category.featureNo")}
            ctaLabel={t("cta.amazon")}
            features={featureMatrix.features}
            rows={featureMatrix.rows}
          />

          <section className="mb-10">
            <h2 className="mb-4 font-display text-2xl font-semibold text-primary">
              {t("category.tableTitle")}
            </h2>
            <ComparisonTable
              rows={rows}
              locale={locale}
              ctaLabel={t("cta.amazon")}
              ctaSublabel={t("cta.amazonSubline")}
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
