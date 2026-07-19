import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Star } from "lucide-react";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AmazonImageLink } from "@/components/affiliate/amazon-image-link";
import { AmazonInlineCta } from "@/components/affiliate/amazon-inline-cta";
import { BuyBox } from "@/components/product/buy-box";
import { CtaButton } from "@/components/affiliate/cta-button";
import { StickyAmazonBar } from "@/components/affiliate/sticky-amazon-bar";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductCard } from "@/components/product/product-card";
import { ProsCons } from "@/components/content/pros-cons";
import { ReviewToc } from "@/components/content/review-toc";
import { ScoreBadge } from "@/components/product/score-badge";
import { ExperienceCommentExplorer } from "@/components/content/experience-comment-explorer";
import { AmazonTrustBadges } from "@/components/product/amazon-trust-badges";
import { ScenarioTags } from "@/components/product/scenario-tags";
import { ValueIndicators } from "@/components/product/value-indicators";
import { ProductManuals } from "@/components/product/product-manuals";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { PriceWatchButton } from "@/components/product/price-watch-button";
import { PriceTrendBadge } from "@/components/product/price-trend-badge";
import { TechDatasheet } from "@/components/product/tech-datasheet";
import { KnownIssuesList } from "@/components/product/known-issues-list";
import { ErrorCodesList } from "@/components/product/error-codes-list";
import { prisma } from "@/lib/db/prisma";
import { asReviewContent } from "@/lib/content-types";
import {
  averageNumeric,
  extractTrustSignals,
} from "@/lib/product-metadata";
import { numericPrice, productOutHref } from "@/lib/product-links";
import {
  parseProductManualLinks,
  resolveProductManuals,
} from "@/lib/product-manuals";
import { extractProductGalleryUrls } from "@/lib/product-gallery";
import {
  computePriceTrend,
  getPriceHistory,
} from "@/lib/price-history";
import {
  parseStoredDatasheet,
  parseStoredErrorCodes,
  parseStoredKnownIssues,
} from "@/lib/product-tech/parse";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { InternalLinks } from "@/components/seo/internal-links";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
  extractAeoFields,
  faqJsonLd,
  organizationJsonLd,
  productReviewJsonLd,
} from "@/lib/seo/jsonld";
import {
  getClusterPages,
  getPillarPage,
  NICHE_CATEGORY_SLUG,
} from "@/lib/seo/niche/bluetooth-headphones";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import { formatPrice, slugify } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";

function estimateReadMinutes(content: {
  verdict?: string;
  directAnswer?: string;
  sections?: Array<{ body?: string }>;
}) {
  const text = [
    content.verdict || "",
    content.directAnswer || "",
    ...(content.sections || []).map((section) => section.body || ""),
  ].join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.min(25, Math.round(words / 180)));
}

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;

  const product = await prisma.product
    .findUnique({
      where: { slug },
      include: {
        articles: {
          where: { type: "review", locale: appLocale, status: "published" },
          take: 1,
        },
      },
    })
    .catch(() => null);

  if (!product) {
    return { title: "Product" };
  }

  const article = product.articles[0];
  const title = article?.seoTitle || article?.title || product.title;
  const description =
    article?.seoDescription ||
    article?.excerpt ||
    (appLocale === "en"
      ? `Independent IGZ review of ${product.title}.`
      : `Unabhängiger IGZ-Testbericht zu ${product.title}.`);

  return buildPageMetadata({
    locale: appLocale,
    title,
    description,
    pathWithoutLocale: `/produkt/${product.slug}`,
    image: product.imageUrl,
    type: "article",
    publishedTime: article?.publishedAt,
    modifiedTime: product.updatedAt,
  });
}

export default async function ProductPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pagePath = `/${locale}/produkt/${slug}`;

  const product = await prisma.product
    .findUnique({
      where: { slug },
      include: {
        category: true,
        articles: {
          where: { type: "review", locale, status: "published" },
          take: 1,
        },
        experienceComments: {
          where: { locale, status: "published" },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    .catch(() => null);

  if (!product) notFound();

  const article = product.articles[0];
  const content = asReviewContent(article?.contentJson);
  const aeo = extractAeoFields(content);
  const ctaHref = productOutHref(product, locale, pagePath);
  const numberLocale = locale === "en" ? "en-US" : "de-DE";
  const isDe = locale === "de";
  const score = content.score ?? product.editorialScore ?? product.rating;
  const pageUrl = absoluteUrl(localizedPath(locale, `/produkt/${product.slug}`));
  const categoryName =
    locale === "en" ? product.category.nameEn : product.category.nameDe;
  const trustSignals = extractTrustSignals(
    product.rawSearchJson,
    product.price?.toString(),
  );

  const [related, categoryPrices, priceHistory] = await Promise.all([
    prisma.product
      .findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
        },
        take: 3,
        orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
      })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { categoryId: product.categoryId },
        select: { price: true },
      })
      .catch(() => []),
    getPriceHistory(product.id),
  ]);

  const categoryAveragePrice = averageNumeric(
    categoryPrices.map((item) => numericPrice(item.price)),
  );
  const currentPrice = numericPrice(product.price);
  const priceTrend = computePriceTrend(priceHistory);
  const galleryUrls = extractProductGalleryUrls(
    product.imageUrl,
    product.rawDetailsJson,
  );

  const manualLinks =
    parseProductManualLinks(product.manualLinks).length > 0
      ? parseProductManualLinks(product.manualLinks)
      : resolveProductManuals(
          {
            title: product.title,
            asin: product.asin,
            country: product.country,
            productUrl: product.productUrl,
            rawSearchJson: product.rawSearchJson,
            rawDetailsJson: product.rawDetailsJson,
            existingManualLinks: product.manualLinks,
          },
          { locale },
        );

  const features = Array.isArray(product.features)
    ? (product.features as string[])
    : [];
  const datasheet = parseStoredDatasheet(product.specsJson);
  const knownIssues = parseStoredKnownIssues(product.knownIssuesJson);
  const errorCodes = parseStoredErrorCodes(product.errorCodesJson);
  const datasheetRows =
    datasheet?.rows.map((row) => ({
      key: row.key,
      label: locale === "en" ? row.labelEn : row.labelDe,
      value: row.value,
      unit: row.unit,
      group: locale === "en" ? row.groupEn : row.groupDe,
    })) ?? [];
  const issueRows =
    knownIssues?.issues.map((issue) => ({
      title: locale === "en" ? issue.titleEn : issue.titleDe,
      summary: locale === "en" ? issue.summaryEn : issue.summaryDe,
      severity: issue.severity,
      status: issue.status,
      sources: issue.sources,
    })) ?? [];
  const errorCodeRows =
    errorCodes?.codes.map((code) => ({
      code: code.code,
      meaning: locale === "en" ? code.meaningEn : code.meaningDe,
      steps: locale === "en" ? code.stepsEn : code.stepsDe,
      severity: code.severity,
    })) ?? [];

  const detailItems =
    datasheetRows.length > 0
      ? datasheetRows.map(
          (row) =>
            `${row.label}: ${row.value}${row.unit ? ` ${row.unit}` : ""}`,
        )
      : features;

  const reviewSections = (content.sections || [])
    .filter((section) => section.heading?.trim() && section.body?.trim())
    .map((section, index) => ({
      ...section,
      id: `abschnitt-${slugify(section.heading) || index + 1}`,
    }));
  const readMinutes = estimateReadMinutes(content);

  const tocSections = [
    { id: "fazit", label: t("product.verdict") },
    ...reviewSections.map((section) => ({
      id: section.id,
      label: section.heading,
    })),
    { id: "pros-cons", label: `${t("product.pros")} / ${t("product.cons")}` },
    ...(manualLinks.length > 0
      ? [{ id: "anleitungen", label: t("product.manualsTitle") }]
      : []),
    ...(datasheetRows.length > 0
      ? [{ id: "datenblatt", label: t("product.datasheetTitle") }]
      : []),
    ...(issueRows.length > 0
      ? [{ id: "bekannte-fehler", label: t("product.knownIssuesTitle") }]
      : []),
    ...(errorCodeRows.length > 0
      ? [{ id: "fehlercodes", label: t("product.errorCodesTitle") }]
      : []),
    ...(detailItems.length > 0
      ? [{ id: "details", label: t("product.details") }]
      : []),
    { id: "nutzererfahrungen", label: t("product.experiences") },
  ];

  const nicheLinks =
    product.category.slug === NICHE_CATEGORY_SLUG
      ? getClusterPages()
          .slice(0, 4)
          .map((page) => ({
            href: `/${locale}${page.path}`,
            title: isDe ? page.h1De : page.h1En,
            description: isDe ? page.descriptionDe : page.descriptionEn,
          }))
      : [];
  const pillar = getPillarPage();

  return (
    <div className="igz-container py-10 pb-24 md:py-14 md:pb-24 xl:pb-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: categoryName,
              url: absoluteUrl(
                localizedPath(locale, `/kategorie/${product.category.slug}`),
              ),
            },
            {
              name: article?.title || product.title,
              url: pageUrl,
            },
          ]),
          productReviewJsonLd({
            locale,
            name: product.title,
            description:
              article?.excerpt ||
              aeo.directAnswer ||
              content.verdict ||
              product.title,
            image: product.imageUrl,
            asin: product.asin,
            price: product.price?.toString(),
            currency: product.currency,
            rating: product.rating,
            reviewCount: product.reviewCount,
            editorialScore:
              typeof score === "number" ? score : product.editorialScore,
            url: pageUrl,
            reviewBody: aeo.directAnswer || content.verdict || article?.excerpt || undefined,
            reviewTitle: article?.title || product.title,
            datePublished: article?.publishedAt,
            keyTakeaways: aeo.keyTakeaways,
          }),
          articleJsonLd({
            locale,
            headline: article?.title || product.title,
            description:
              article?.seoDescription ||
              article?.excerpt ||
              aeo.directAnswer ||
              undefined,
            url: pageUrl,
            image: product.imageUrl,
            datePublished: article?.publishedAt,
            dateModified: product.updatedAt,
          }),
          aeo.directAnswer
            ? aeoAnswerJsonLd({
                question: article?.title || product.title,
                answer: aeo.directAnswer,
                url: pageUrl,
                locale,
              })
            : null,
          faqJsonLd(content.faq || []),
        ]}
      />
      <div className="grid gap-8 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
        <div className="hidden xl:block">
          <ReviewToc
            title={t("product.inThisReview")}
            sections={tocSections}
            activeId="pros-cons"
          />
          <div className="igz-card mt-5 p-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
              {t("product.analyst")}
            </p>
            <p className="mt-3 font-display text-base font-semibold text-primary">
              IGZ Editorial
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("product.analystRole")}
            </p>
          </div>
        </div>

        <div>
          <Breadcrumbs
            items={[
              { label: t("nav.home"), href: `/${locale}` },
              {
                label: categoryName,
                href: `/${locale}/kategorie/${product.category.slug}`,
              },
              { label: article?.title || product.title },
            ]}
          />

          <div className="mb-6 mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-secondary/10 px-3 py-1 font-semibold text-secondary">
              {t("product.reviewBadge")}
            </span>
            <span className="text-muted-foreground">
              {locale === "en"
                ? `${readMinutes} min read`
                : `${readMinutes} Min. Lesezeit`}
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
            {article?.title || product.title}
          </h1>

          <AmazonTrustBadges
            signals={trustSignals}
            href={ctaHref}
            labels={{
              bestSeller: t("product.trustBestSeller"),
              amazonChoice: t("product.trustAmazonChoice"),
              salesVolume: trustSignals.salesVolume || "",
            }}
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <ValueIndicators
              price={currentPrice}
              categoryAveragePrice={categoryAveragePrice}
              savingsPercent={trustSignals.savingsPercent}
              lastSyncedAt={product.lastSyncedAt}
              locale={locale}
              href={ctaHref}
              labels={{
                belowAverage: t("product.valueBelowAverage"),
                aboveAverage: t("product.valueAboveAverage"),
                onPar: t("product.valueOnPar"),
                savings: t("product.valueSavings"),
                updated: t("product.valueUpdated"),
              }}
            />
            <PriceTrendBadge
              trend={priceTrend.trend}
              changePercent={priceTrend.changePercent}
              labels={{
                down: t("product.priceTrendDown"),
                up: t("product.priceTrendUp"),
                stable: t("product.priceTrendStable"),
                unknown: t("product.priceTrendUnknown"),
              }}
            />
          </div>

          {galleryUrls.length > 1 ? (
            <ProductImageGallery images={galleryUrls} alt={product.title} />
          ) : product.imageUrl ? (
            <AmazonImageLink
              href={ctaHref}
              src={product.imageUrl}
              alt={product.title}
              overlayLabel={t("product.imageOverlay")}
              className="mt-6"
              sizes="(max-width: 1280px) 100vw, 70vw"
              priority
            />
          ) : null}

          <div className="mt-6">
            <AffiliateDisclosure text={t("disclosure.short")} />
          </div>

          <div className="mt-6">
            <AeoAnswerBlock
              eyebrow={t("product.directAnswer")}
              answer={
                aeo.directAnswer ||
                content.verdict ||
                article?.excerpt ||
                product.title
              }
              takeawaysTitle={t("product.keyTakeaways")}
              takeaways={aeo.keyTakeaways}
            />
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="igz-card flex flex-col items-center justify-center p-5 text-center">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                {t("product.igzScore")}
              </p>
              <div className="mt-3">
                <ScoreBadge
                  score={score}
                  size="lg"
                  label={t("product.score")}
                  showBadge
                  badgeLabel={t("home.editorsChoice")}
                />
              </div>
            </div>
            <div className="igz-card p-5">
              <h2 className="font-display text-base font-semibold text-primary">
                {t("product.categoryBreakdown")}
              </h2>
              <div className="mt-4 space-y-4">
                {[
                  {
                    label: t("product.performance"),
                    display:
                      typeof score === "number" ? `${score.toFixed(1)}/10` : "—",
                    width:
                      typeof score === "number"
                        ? Math.min(score * 10, 100)
                        : 0,
                  },
                  {
                    label: isDe ? "Amazon-Bewertung" : "Amazon rating",
                    display:
                      typeof product.rating === "number"
                        ? `${product.rating.toFixed(1)}/5 · ${product.reviewCount}`
                        : "—",
                    width:
                      typeof product.rating === "number"
                        ? Math.min((product.rating / 5) * 100, 100)
                        : 0,
                  },
                  {
                    label: t("product.build"),
                    display:
                      typeof product.editorialScore === "number"
                        ? `${product.editorialScore.toFixed(1)}/10`
                        : "—",
                    width:
                      typeof product.editorialScore === "number"
                        ? Math.min(product.editorialScore * 10, 100)
                        : 0,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-primary">
                        {item.display}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-muted">
                      <div
                        className="h-2 rounded-full bg-secondary"
                        style={{ width: `${item.width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="fazit" className="prose-article mt-10">
            <h2>{t("product.verdict")}</h2>
            <p>{content.verdict || article?.excerpt || product.title}</p>
          </section>

          {reviewSections.length > 0 ? (
            <div className="mt-10 xl:hidden">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
                {locale === "en" ? "In this test" : "In diesem Test"}
              </p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {reviewSections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-primary transition hover:border-secondary/40 hover:text-secondary"
                  >
                    {index + 1}. {section.heading}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-10 space-y-6">
            {reviewSections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6 md:p-7"
              >
                <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                  {locale === "en"
                    ? `Section ${index + 1} of ${reviewSections.length}`
                    : `Abschnitt ${index + 1} von ${reviewSections.length}`}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-primary">
                  {section.heading}
                </h2>
                <div className="prose-article mt-4">
                  {section.body
                    .split(/\n{2,}/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, paragraphIndex) => (
                      <p key={`${section.id}-${paragraphIndex}`}>
                        {paragraph}
                      </p>
                    ))}
                </div>
              </section>
            ))}
          </div>

          <AmazonInlineCta
            title={t("product.inlineCtaTitle")}
            body={t("product.inlineCtaAfterVerdict")}
            ctaHref={ctaHref}
            ctaLabel={t("cta.buyOnAmazon")}
            ctaSublabel={t("cta.amazonSubline")}
            priceLabel={formatPrice(
              product.price?.toString(),
              product.currency,
              numberLocale,
            )}
          />

          <div className="mt-8 flex flex-wrap items-center gap-4 lg:hidden">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
              <span className="font-medium text-primary">
                {product.rating ?? "—"} ({product.reviewCount})
              </span>
            </div>
            <a
              href={ctaHref}
              target="_blank"
              rel="nofollow sponsored noopener noreferrer"
              className="text-xl font-bold text-primary transition hover:text-amazon-hover"
            >
              {formatPrice(
                product.price?.toString(),
                product.currency,
                numberLocale,
              )}
            </a>
            <CtaButton
              href={ctaHref}
              label={t("cta.buyOnAmazon")}
              sublabel={t("cta.amazonSubline")}
              className="w-full"
              size="lg"
              variant="amazon"
            />
          </div>

          <section id="pros-cons" className="mt-10">
            <h2 className="mb-4 font-display text-2xl font-semibold text-primary">
              {t("product.verdictBreakdown")}
            </h2>
            <ProsCons
              prosTitle={t("product.theGood")}
              consTitle={t("product.theBad")}
              pros={content.pros || []}
              cons={content.cons || []}
            />
          </section>

          <AmazonInlineCta
            title={t("product.inlineCtaTitle")}
            body={t("product.inlineCtaBody")}
            ctaHref={ctaHref}
            ctaLabel={t("cta.amazon")}
            ctaSublabel={t("cta.amazonSubline")}
          />

          <section className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="igz-card p-5">
              <h2 className="font-display text-sm font-semibold text-primary">
                {t("product.bestFor")}
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {(content.bestFor || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="igz-card p-5">
              <h2 className="font-display text-sm font-semibold text-primary">
                {t("product.notFor")}
              </h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                {(content.notFor || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </section>

          <ScenarioTags
            title={t("product.scenarioTagsTitle")}
            tags={content.bestFor || []}
            locale={locale}
            categorySlug={product.category.slug}
            hint={t("product.scenarioTagsHint")}
          />

          <ProductManuals
            manuals={manualLinks}
            labels={{
              title: t("product.manualsTitle"),
              subtitle: t("product.manualsSubtitle"),
              disclaimer: t("product.manualsDisclaimer"),
              sourceManufacturer: t("product.manualsSourceManufacturer"),
              sourceAmazon: t("product.manualsSourceAmazon"),
              sourcePortal: t("product.manualsSourcePortal"),
            }}
          />

          {datasheetRows.length > 0 ? (
            <TechDatasheet
              title={t("product.datasheetTitle")}
              subtitle={t("product.datasheetSubtitle")}
              rows={datasheetRows}
              sourceNote={
                locale === "en"
                  ? datasheet?.sourceNotesEn
                  : datasheet?.sourceNotesDe
              }
            />
          ) : null}

          {issueRows.length > 0 ? (
            <KnownIssuesList
              title={t("product.knownIssuesTitle")}
              disclaimer={
                (locale === "en"
                  ? knownIssues?.disclaimerEn
                  : knownIssues?.disclaimerDe) ||
                t("product.knownIssuesDisclaimer")
              }
              sourcesLabel={t("product.knownIssuesSources")}
              severityLabels={{
                low: t("product.severityLow"),
                medium: t("product.severityMedium"),
                high: t("product.severityHigh"),
              }}
              statusLabels={{
                reported: t("product.issueStatusReported"),
                widespread: t("product.issueStatusWidespread"),
                fixed_in_update: t("product.issueStatusFixed"),
                unconfirmed: t("product.issueStatusUnconfirmed"),
              }}
              issues={issueRows}
            />
          ) : null}

          {errorCodeRows.length > 0 ? (
            <ErrorCodesList
              title={t("product.errorCodesTitle")}
              note={
                (locale === "en" ? errorCodes?.noteEn : errorCodes?.noteDe) ||
                t("product.errorCodesNote")
              }
              stepsLabel={t("product.errorCodesSteps")}
              severityLabels={{
                low: t("product.severityLow"),
                medium: t("product.severityMedium"),
                high: t("product.severityHigh"),
              }}
              codes={errorCodeRows}
            />
          ) : null}

          {detailItems.length > 0 ? (
            <section id="details" className="mt-10">
              <h2 className="mb-4 font-display text-2xl font-semibold text-primary">
                {t("product.details")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {detailItems.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <ExperienceCommentExplorer
            productSlug={product.slug}
            locale={locale}
            labels={{
              title: t("product.experiences"),
              disclaimer: t("product.experiencesDisclaimer"),
              weeksLabel: t("product.usageWeeks"),
              emptyLabel: t("product.experiencesEmpty"),
              filterAll: t("product.experienceFilterAll"),
              filterPositive: t("product.experienceFilterPositive"),
              filterCritical: t("product.experienceFilterCritical"),
              sortRecent: t("product.experienceSortRecent"),
              sortRating: t("product.experienceSortRating"),
              averageRating: t("product.experienceAverageRating"),
              countLabel: t("product.experienceCount"),
              badgeUser: t("product.experienceBadgeUser"),
              formTitle: t("product.experienceFormTitle"),
              formHint: t("product.experienceFormHint"),
              formName: t("product.experienceFormName"),
              formContext: t("product.experienceFormContext"),
              formEmail: t("product.experienceFormEmail"),
              formEmailHint: t("product.experienceFormEmailHint"),
              formRating: t("product.experienceFormRating"),
              formReportTitle: t("product.experienceFormReportTitle"),
              formBody: t("product.experienceFormBody"),
              formUsageWeeks: t("product.experienceFormUsageWeeks"),
              formSubmit: t("product.experienceFormSubmit"),
              formSubmitting: t("product.experienceFormSubmitting"),
              formSuccess: t("product.experienceFormSuccess"),
              formError: t("product.experienceFormError"),
            }}
            comments={product.experienceComments}
          />

          <FaqAccordion items={content.faq || []} />

          <div className="mt-10">
            <CtaButton
              href={ctaHref}
              label={t("cta.buyOnAmazon")}
              sublabel={t("cta.amazonSubline")}
              size="lg"
              variant="amazon"
            />
          </div>
        </div>

        <div className="hidden xl:block">
          <BuyBox
            title={product.title}
            imageUrl={product.imageUrl}
            score={score}
            scoreLabel={t("product.score")}
            editorChoiceLabel={t("home.editorsChoice")}
            price={product.price?.toString()}
            currency={product.currency}
            locale={locale}
            priceNote={t("product.priceNote")}
            lastSyncedAt={product.lastSyncedAt}
            ctaHref={ctaHref}
            ctaLabel={t("cta.buyOnAmazon")}
            ctaSublabel={t("cta.amazonSubline")}
            imageOverlayLabel={t("product.imageOverlay")}
            amazonHint={t("product.amazonHint")}
            disclosureInline={t("disclosure.inline")}
          />
          <p className="mt-3 text-xs leading-5 text-muted">{t("product.scoreHint")}</p>
          <PriceWatchButton
            slug={product.slug}
            title={product.title}
            price={currentPrice}
            currency={product.currency}
            labels={{
              watch: t("product.priceWatch"),
              watching: t("product.priceWatching"),
              hint: t("product.priceWatchHint"),
            }}
          />
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-primary">
            {t("product.related")}
          </h2>
          {related[0] ? (
            <Link
              href={`/${locale}/vergleich/${product.slug}-vs-${related[0].slug}`}
              className="text-sm font-semibold text-secondary hover:underline"
            >
              {t("compare.compareWith", { product: related[0].title })} →
            </Link>
          ) : null}
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {related.map((item) => (
            <ProductCard
              key={item.id}
              href={`/${locale}/produkt/${item.slug}`}
              title={item.title}
              imageUrl={item.imageUrl}
              score={item.editorialScore ?? item.rating}
              price={item.price?.toString()}
              currency={item.currency}
              locale={locale}
              ctaLabel={t("cta.amazon")}
              ctaSublabel={t("cta.amazonSubline")}
              ctaHref={productOutHref(item, locale, pagePath)}
              readLabel={t("category.readReview")}
              amazonOverlayLabel={t("product.imageOverlay")}
            />
          ))}
        </div>
      </section>

      <InternalLinks
        title={t("product.internalLinks")}
        items={[
          {
            href: `/${locale}/kategorie/${product.category.slug}`,
            title: `${categoryName} ${t("category.comparison")}`,
            description:
              (isDe
                ? product.category.descriptionDe
                : product.category.descriptionEn) || undefined,
          },
          {
            href: `/${locale}/reviews?category=${product.category.slug}`,
            title: isDe ? "Alle Tests dieser Kategorie" : "All tests in this category",
            description: isDe
              ? "Weitere redaktionelle Amazon-Tests im Überblick"
              : "More editorial Amazon tests at a glance",
          },
          {
            href: `/${locale}/methodik`,
            title: t("footer.methodology"),
            description: isDe
              ? "So entstehen IGZ-Scores und Testberichte"
              : "How IGZ scores and reviews are created",
          },
          ...(product.category.slug === NICHE_CATEGORY_SLUG
            ? [
                {
                  href: `/${locale}${pillar.path}`,
                  title: isDe ? pillar.h1De : pillar.h1En,
                  description: isDe
                    ? pillar.descriptionDe
                    : pillar.descriptionEn,
                },
                ...nicheLinks,
              ]
            : []),
        ]}
      />

      <StickyAmazonBar
        title={product.title}
        price={product.price?.toString()}
        currency={product.currency}
        locale={locale}
        ctaHref={ctaHref}
        ctaLabel={t("cta.buyOnAmazon")}
        ctaSublabel={t("cta.amazonSubline")}
      />
    </div>
  );
}
