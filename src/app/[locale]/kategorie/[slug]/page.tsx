import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AwardBadge } from "@/components/comparison/award-badge";
import { AwardPicker } from "@/components/comparison/award-picker";
import { FilteredComparisonSection } from "@/components/comparison/filtered-comparison-section";
import { FeatureComparisonMatrix } from "@/components/comparison/feature-comparison-matrix";
import { SpecComparisonMatrix } from "@/components/comparison/spec-comparison-matrix";
import { ProductMatchFinder } from "@/components/comparison/product-match-finder";
import { CtaButton } from "@/components/affiliate/cta-button";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { InternalLinks } from "@/components/seo/internal-links";
import { JsonLd } from "@/components/seo/json-ld";
import { resolveCategoryImageSrc } from "@/lib/category-image-src";
import { prisma } from "@/lib/db/prisma";
import { asComparisonContent, asReviewContent } from "@/lib/content-types";
import { buildFeatureMatrix } from "@/lib/product-ranking";
import { collectFeatureList } from "@/lib/product-metadata";
import { buildSpecMatrix } from "@/lib/product-tech/matrix";
import { numericPrice, productOutHref } from "@/lib/product-links";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import {
  getClusterPages,
  getPillarPage,
  NICHE_CATEGORY_SLUG,
} from "@/lib/seo/niche/bluetooth-headphones";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ useCase?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;

  const category = await prisma.category
    .findUnique({
      where: { slug },
      include: {
        articles: {
          where: { type: "comparison", locale: appLocale, status: "published" },
          take: 1,
        },
      },
    })
    .catch(() => null);

  if (!category) {
    return { title: "Category" };
  }

  const article = category.articles[0];
  const name = appLocale === "en" ? category.nameEn : category.nameDe;
  const title =
    article?.seoTitle ||
    `${name} ${appLocale === "en" ? "Comparison" : "Vergleich"}`;
  const description =
    article?.seoDescription ||
    article?.excerpt ||
    (appLocale === "en" ? category.descriptionEn : category.descriptionDe) ||
    (appLocale === "en"
      ? `Compare the best ${name} products with IGZ scores and buying tips.`
      : `${name} im IGZ-Vergleich – Scores, Preise und Kaufempfehlungen.`);

  return buildPageMetadata({
    locale: appLocale,
    title,
    description,
    pathWithoutLocale: `/kategorie/${category.slug}`,
    image: category.imageUrl,
    type: "article",
    publishedTime: article?.publishedAt,
    modifiedTime: category.updatedAt,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { locale: localeParam, slug } = await params;
  const { useCase: initialUseCase = "" } = await searchParams;
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

  const buyingGuide = await prisma.article
    .findFirst({
      where: {
        categoryId: category.id,
        type: "buying_guide",
        locale,
        status: "published",
      },
    })
    .catch(() => null);

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
  const categoryImageSrc = resolveCategoryImageSrc({
    id: category.id,
    slug: category.slug,
    imageUrl: category.imageUrl,
    imageMimeType: category.imageMimeType,
  });

  const rows = category.products.map((product, index) => {
    const review = reviewContentByProductId.get(product.id);
    const bestFor = review?.bestFor ?? [];
    return {
      rank: index + 1,
      title: product.title,
      href: `/${locale}/produkt/${product.slug}`,
      imageUrl: product.imageUrl,
      score: product.editorialScore ?? product.rating,
      price: product.price?.toString(),
      currency: product.currency,
      ctaHref: productOutHref(product, locale, pagePath),
      excerpt: [description, ...bestFor].filter(Boolean).join(" · "),
      badge:
        comparison?.winnerProductId === product.id
          ? t("category.winner")
          : comparison?.priceWinnerId === product.id
            ? t("category.priceWinner")
            : null,
    };
  });

  const useCaseOptions = [
    ...new Set(
      category.products.flatMap((product) => {
        const review = reviewContentByProductId.get(product.id);
        return review?.bestFor ?? [];
      }),
    ),
  ].slice(0, 12);

  const productPrices = category.products
    .map((product) => numericPrice(product.price))
    .filter((price): price is number => price !== null);
  const priceBounds = {
    min: productPrices.length > 0 ? Math.floor(Math.min(...productPrices)) : 0,
    max: productPrices.length > 0 ? Math.ceil(Math.max(...productPrices)) : 1000,
  };

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
  const specMatrix = buildSpecMatrix(
    category.products.map((product) => ({
      id: product.id,
      title: product.title,
      specsJson: product.specsJson,
      features: product.features,
      ctaHref: productOutHref(product, locale, pagePath),
    })),
    locale,
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

  const pageUrl = absoluteUrl(localizedPath(locale, `/kategorie/${slug}`));
  const isDe = locale === "de";
  const pillar = getPillarPage();
  const nicheDirectAnswer =
    slug === NICHE_CATEGORY_SLUG
      ? isDe
        ? pillar.directAnswerDe
        : pillar.directAnswerEn
      : "";
  const nicheTakeaways =
    slug === NICHE_CATEGORY_SLUG
      ? isDe
        ? pillar.keyTakeawaysDe
        : pillar.keyTakeawaysEn
      : [];
  const directAnswer =
    content.directAnswer ||
    nicheDirectAnswer ||
    (comparison?.winnerProduct
      ? isDe
        ? `Aktueller Testsieger in ${name}: ${comparison.winnerProduct.title}.`
        : `Current top pick in ${name}: ${comparison.winnerProduct.title}.`
      : description || "");
  const keyTakeaways =
    content.keyTakeaways && content.keyTakeaways.length > 0
      ? content.keyTakeaways
      : nicheTakeaways;

  return (
    <div className="igz-container py-10 md:py-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Kategorien" : "Categories",
              url: absoluteUrl(localizedPath(locale, "/kategorien")),
            },
            { name: name, url: pageUrl },
          ]),
          itemListJsonLd({
            name: article?.title || `${name} ${t("category.comparison")}`,
            description: description || undefined,
            url: pageUrl,
            items: category.products.slice(0, 20).map((product, index) => ({
              position: index + 1,
              name: product.title,
              url: absoluteUrl(
                localizedPath(locale, `/produkt/${product.slug}`),
              ),
            })),
          }),
          directAnswer
            ? aeoAnswerJsonLd({
                question: isDe
                  ? `Welches ist das beste Produkt in ${name}?`
                  : `What is the best product in ${name}?`,
                answer: directAnswer,
                url: pageUrl,
                locale,
              })
            : null,
          faqJsonLd(content.faq || []),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: t("nav.categories"), href: `/${locale}/kategorien` },
          { label: name },
        ]}
      />

      <div className="mt-6 grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/70 bg-surface-muted shadow-sm">
          <Image
            src={categoryImageSrc}
            alt={name}
            fill
            className="object-cover"
            sizes="220px"
            unoptimized
            priority
          />
        </div>
        <div className="max-w-4xl">
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
          {buyingGuide ? (
            <Link
              href={`/${locale}/kategorie/${slug}/kaufberatung`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
            >
              {t("guide.readGuide")} →
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        <AffiliateDisclosure text={t("disclosure.short")} />
      </div>

      <div className="mt-6">
        <AeoAnswerBlock
          eyebrow={t("product.directAnswer")}
          answer={directAnswer}
          takeawaysTitle={t("product.keyTakeaways")}
          takeaways={keyTakeaways}
        />
      </div>

      <div className="mt-10">
        <ProductMatchFinder
          candidates={matchCandidates}
          locale={locale}
          initialUseCase={initialUseCase}
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

          {specMatrix.columns.length > 0 ? (
            <SpecComparisonMatrix
              title={t("category.specMatrixTitle")}
              featureLabel={t("category.featureColumn")}
              missingLabel={t("category.specMissing")}
              ctaLabel={t("cta.amazon")}
              columns={specMatrix.columns}
              rows={specMatrix.rows}
            />
          ) : (
            <FeatureComparisonMatrix
              title={t("category.featureMatrixTitle")}
              featureLabel={t("category.featureColumn")}
              yesLabel={t("category.featureYes")}
              noLabel={t("category.featureNo")}
              ctaLabel={t("cta.amazon")}
              features={featureMatrix.features}
              rows={featureMatrix.rows}
            />
          )}

          <section className="mb-10">
            <h2 className="mb-4 font-display text-2xl font-semibold text-primary">
              {t("category.tableTitle")}
            </h2>
            <FilteredComparisonSection
              rows={rows}
              useCaseOptions={useCaseOptions}
              priceBounds={priceBounds}
              locale={locale}
              filterLabels={{
                filters: t("category.filters"),
                filterPrice: t("category.filterPrice"),
                filterUseCase: t("category.filterUseCase"),
                filterMinScore: t("category.filterMinScore"),
                reset: t("category.filterReset"),
                results: t("category.filterResults"),
              }}
              tableLabels={{
                ctaLabel: t("cta.amazon"),
                ctaSublabel: t("cta.amazonSubline"),
                readLabel: t("category.readReview"),
                availableOnAmazonLabel: t("category.availableOnAmazon"),
                columns: {
                  model: t("category.columnModel"),
                  specs: t("category.columnSpecs"),
                  priceAction: t("category.columnPriceAction"),
                },
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

          <InternalLinks
            title={t("product.internalLinks")}
            items={[
              {
                href: `/${locale}/reviews?category=${slug}`,
                title: isDe
                  ? `Alle ${name}-Tests`
                  : `All ${name} reviews`,
                description: isDe
                  ? "Redaktionelle Einzeltests filtern und sortieren"
                  : "Filter and sort editorial single-product tests",
              },
              ...(buyingGuide
                ? [
                    {
                      href: `/${locale}/kategorie/${slug}/kaufberatung`,
                      title: buyingGuide.title,
                      description: buyingGuide.excerpt || undefined,
                    },
                  ]
                : []),
              {
                href: `/${locale}/ratgeber`,
                title: t("nav.guides"),
                description: isDe
                  ? "Themen-Ratgeber und Kaufhilfen"
                  : "Topic guides and buying advice",
              },
              {
                href: `/${locale}/methodik`,
                title: t("footer.methodology"),
                description: isDe
                  ? "Transparente Bewertungskriterien"
                  : "Transparent scoring criteria",
              },
              ...(slug === NICHE_CATEGORY_SLUG
                ? getClusterPages()
                    .slice(0, 5)
                    .map((page) => ({
                      href: `/${locale}${page.path}`,
                      title: isDe ? page.h1De : page.h1En,
                      description: isDe
                        ? page.descriptionDe
                        : page.descriptionEn,
                    }))
                : []),
            ]}
          />
      </div>
    </div>
  );
}
