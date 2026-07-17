import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { BuyBox } from "@/components/product/buy-box";
import { CtaButton } from "@/components/affiliate/cta-button";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { ArticleToc } from "@/components/content/article-toc";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductCard } from "@/components/product/product-card";
import { ProsCons } from "@/components/content/pros-cons";
import { DecisionGuide } from "@/components/product/decision-guide";
import { ScoreBadge } from "@/components/product/score-badge";
import { ScoreBreakdown } from "@/components/product/score-breakdown";
import { UserExperienceComments } from "@/components/content/user-experience-comments";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { InternalLinks } from "@/components/seo/internal-links";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { asReviewContent } from "@/lib/content-types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  breadcrumbJsonLd,
  extractAeoFields,
  faqJsonLd,
  organizationJsonLd,
  productReviewJsonLd,
} from "@/lib/seo/jsonld";
import { estimateReadingTimeMinutes } from "@/lib/seo/reading-time";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import { formatPrice } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

async function getProduct(slug: string, locale: AppLocale) {
  return prisma.product
    .findUnique({
      where: { slug },
      include: {
        category: true,
        articles: {
          where: { type: "review", locale, status: "published" },
          take: 1,
        },
        experienceComments: {
          where: { locale },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    .catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  const product = await getProduct(slug, locale);
  if (!product) {
    return { title: "Not found" };
  }

  const article = product.articles[0];
  const content = asReviewContent(article?.contentJson);
  const title =
    content.seoTitle ||
    article?.title ||
    (locale === "en"
      ? `${product.title} Review`
      : `${product.title} Testbericht`);
  const description =
    content.seoDescription ||
    content.directAnswer ||
    article?.excerpt ||
    content.verdict ||
    product.title;

  return buildPageMetadata({
    locale,
    title,
    description,
    pathWithoutLocale: `/produkt/${product.slug}`,
    image: product.imageUrl,
    type: "article",
    publishedTime: article?.publishedAt,
    modifiedTime: article?.updatedAt || product.updatedAt,
  });
}

export default async function ProductPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const product = await getProduct(slug, locale);
  if (!product) notFound();

  const article = product.articles[0];
  const content = asReviewContent(article?.contentJson);
  const aeo = extractAeoFields(content);
  const ctaHref = product.affiliateUrl || product.productUrl || "#";
  const numberLocale = locale === "en" ? "en-US" : "de-DE";
  const categoryName =
    locale === "en" ? product.category.nameEn : product.category.nameDe;
  const pageUrl = absoluteUrl(localizedPath(locale, `/produkt/${product.slug}`));

  const [related, otherCategories] = await Promise.all([
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
    prisma.category
      .findMany({
        where: { id: { not: product.categoryId } },
        take: 4,
        orderBy: { updatedAt: "desc" },
      })
      .catch(() => []),
  ]);

  const features = Array.isArray(product.features)
    ? (product.features as string[])
    : [];

  const readingMinutes = estimateReadingTimeMinutes(
    [
      content.directAnswer,
      content.verdict,
      ...(content.sections || []).map((s) => s.body),
    ]
      .filter(Boolean)
      .join(" "),
  );

  const toc = [
    { id: "kurzantwort", label: t("product.directAnswer") },
    { id: "fazit", label: t("product.verdict") },
    { id: "score-breakdown", label: t("product.scoreBreakdown") },
    { id: "entscheidung", label: t("product.decisionGuide") },
    { id: "pros-cons", label: `${t("product.pros")} / ${t("product.cons")}` },
    { id: "details", label: t("product.details") },
    { id: "nutzererfahrungen", label: t("product.experiences") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            {
              name: t("nav.home"),
              url: absoluteUrl(localizedPath(locale)),
            },
            {
              name: categoryName,
              url: absoluteUrl(
                localizedPath(locale, `/kategorie/${product.category.slug}`),
              ),
            },
            { name: product.title, url: pageUrl },
          ]),
          productReviewJsonLd({
            locale,
            name: product.title,
            description:
              content.directAnswer ||
              content.verdict ||
              article?.excerpt ||
              product.title,
            image: product.imageUrl,
            asin: product.asin,
            price: product.price?.toString(),
            currency: product.currency,
            rating: product.rating,
            reviewCount: product.reviewCount,
            editorialScore: content.score ?? product.editorialScore,
            url: pageUrl,
            reviewBody: content.verdict,
            reviewTitle: article?.title,
            datePublished: article?.publishedAt,
            keyTakeaways: aeo.keyTakeaways,
          }),
          faqJsonLd(content.faq || []),
          aeo.directAnswer
            ? aeoAnswerJsonLd({
                question:
                  locale === "en"
                    ? `Is ${product.title} worth buying?`
                    : `Lohnt sich ${product.title}?`,
                answer: aeo.directAnswer,
                url: pageUrl,
                locale,
              })
            : null,
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          {
            label: categoryName,
            href: `/${locale}/kategorie/${product.category.slug}`,
          },
          { label: product.title },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-6 flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row">
            <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-xl bg-zinc-50 md:mx-0">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  className="object-contain p-3"
                  sizes="192px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-700">{categoryName}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl">
                {article?.title || product.title}
              </h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-zinc-500">
                {content.testingPeriod ? (
                  <span>
                    {t("product.testingPeriod")}: {content.testingPeriod}
                  </span>
                ) : null}
                <span>
                  {readingMinutes} {t("product.readingTime")}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <ScoreBadge
                  score={content.score ?? product.editorialScore ?? product.rating}
                  size="lg"
                  label={t("product.score")}
                />
                <div>
                  <p className="text-xl font-bold">
                    {formatPrice(
                      product.price?.toString(),
                      product.currency,
                      numberLocale,
                    )}
                  </p>
                  <p className="text-sm text-zinc-500">
                    ★ {product.rating ?? "—"} ({product.reviewCount})
                  </p>
                </div>
              </div>
              <div className="mt-4 lg:hidden">
                <CtaButton
                  href={ctaHref}
                  label={t("cta.amazon")}
                  className="w-full"
                  size="lg"
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <AffiliateDisclosure text={t("disclosure.short")} />
          </div>

          <ArticleToc title={t("product.toc")} items={toc} />

          <div id="kurzantwort">
            <AeoAnswerBlock
              eyebrow={t("product.directAnswer")}
              answer={aeo.directAnswer}
              takeawaysTitle={t("product.keyTakeaways")}
              takeaways={aeo.keyTakeaways}
            />
          </div>

          <section id="fazit" className="prose-article mb-8 font-serif">
            <h2>{t("product.verdict")}</h2>
            <p>{content.verdict || article?.excerpt || product.title}</p>
            {content.sections?.map((section) => (
              <div key={section.heading} className="mt-6">
                <h2>{section.heading}</h2>
                {section.body.split(/\n{2,}/).map((paragraph, idx) => (
                  <p key={`${section.heading}-${idx}`}>{paragraph}</p>
                ))}
              </div>
            ))}
          </section>

          <div className="mb-8 flex justify-center">
            <CtaButton href={ctaHref} label={t("cta.amazon")} size="lg" />
          </div>

          <div id="score-breakdown">
            <ScoreBreakdown
              title={t("product.scoreBreakdown")}
              labels={{
                overall: t("product.scoreOverall"),
                value: t("product.scoreValue"),
                quality: t("product.scoreQuality"),
                usability: t("product.scoreUsability"),
                longevity: t("product.scoreLongevity"),
              }}
              breakdown={
                aeo.scoreBreakdown || {
                  overall: content.score ?? product.editorialScore ?? undefined,
                }
              }
            />
          </div>

          <div id="entscheidung">
            <DecisionGuide
              title={t("product.decisionGuide")}
              buyTitle={t("product.buyIf")}
              skipTitle={t("product.skipIf")}
              buyIf={aeo.decisionGuide?.buyIf || content.bestFor}
              skipIf={aeo.decisionGuide?.skipIf || content.notFor}
            />
          </div>

          <section id="pros-cons" className="mb-8">
            <ProsCons
              prosTitle={t("product.pros")}
              consTitle={t("product.cons")}
              pros={content.pros || []}
              cons={content.cons || []}
            />
          </section>

          <section id="details" className="mb-8">
            <h2 className="mb-3 text-xl font-bold">{t("product.details")}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                >
                  {feature}
                </div>
              ))}
            </div>
          </section>

          <UserExperienceComments
            title={t("product.experiences")}
            disclaimer={t("product.experiencesDisclaimer")}
            weeksLabel={t("product.usageWeeks")}
            emptyLabel={t("product.experiencesEmpty")}
            comments={product.experienceComments}
          />

          <FaqAccordion items={content.faq || []} />

          <div className="mt-10">
            <CtaButton href={ctaHref} label={t("cta.amazon")} size="lg" />
          </div>
        </div>

        <div className="hidden lg:block">
          <BuyBox
            score={content.score ?? product.editorialScore ?? product.rating}
            scoreLabel={t("product.score")}
            price={product.price?.toString()}
            currency={product.currency}
            locale={locale}
            priceNote={t("product.priceNote")}
            lastSyncedAt={product.lastSyncedAt}
            ctaHref={ctaHref}
            ctaLabel={t("cta.amazon")}
            disclosureInline={t("disclosure.inline")}
          />
          <p className="mt-3 text-xs text-zinc-500">{t("product.scoreHint")}</p>
        </div>
      </div>

      <section className="mt-14">
        <h2 className="mb-6 text-2xl font-bold">{t("product.related")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
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
              ctaHref={item.affiliateUrl || item.productUrl || "#"}
              readLabel={t("category.readReview")}
            />
          ))}
        </div>
      </section>

      <InternalLinks
        title={t("product.internalLinks")}
        items={[
          {
            href: `/${locale}/kategorie/${product.category.slug}`,
            title:
              locale === "en"
                ? `${categoryName} comparison`
                : `${categoryName} Vergleich`,
            description:
              locale === "en"
                ? product.category.descriptionEn
                : product.category.descriptionDe,
          },
          {
            href: `/${locale}/bestenlisten`,
            title: t("nav.bestLists"),
            description:
              locale === "en"
                ? "All category winners in one place"
                : "Alle Kategorie-Testsieger auf einen Blick",
          },
          {
            href: `/${locale}/methodik`,
            title: t("nav.methodology"),
            description:
              locale === "en"
                ? "How scores and reviews are created"
                : "So entstehen Scores und Testberichte",
          },
          ...otherCategories.map((category) => ({
            href: `/${locale}/kategorie/${category.slug}`,
            title: locale === "en" ? category.nameEn : category.nameDe,
            description:
              locale === "en" ? category.descriptionEn : category.descriptionDe,
          })),
        ]}
      />
    </div>
  );
}
