import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { ProductCard } from "@/components/product/product-card";
import { ReviewsToolbar } from "@/components/reviews/reviews-toolbar";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { productOutHref } from "@/lib/product-links";
import {
  listPublishedReviews,
  parseReviewSort,
} from "@/lib/reviews/list-reviews";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    minScore?: string;
    sort?: string;
    page?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale = localeParam as AppLocale;
  const page = Math.max(1, Number(sp.page || 1) || 1);
  const hasFilters = Boolean(
    sp.q ||
      sp.category ||
      sp.minScore ||
      (sp.sort && sp.sort !== "newest") ||
      page > 1,
  );
  return buildPageMetadata({
    locale,
    title:
      locale === "en"
        ? "All product reviews & tests"
        : "Alle Produkttests & Reviews",
    description:
      locale === "en"
        ? "Browse all IGZ Amazon product tests. Filter by category and score, sort by date, price or rating."
        : "Alle IGZ Amazon-Produkttests im Überblick. Filtern nach Kategorie und Score, sortieren nach Datum, Preis oder Bewertung.",
    pathWithoutLocale: "/reviews",
    noIndex: hasFilters,
  });
}

function buildHref(
  locale: AppLocale,
  values: {
    q?: string | null;
    category?: string | null;
    minScore?: number | null;
    sort?: string | null;
    page?: number | null;
  },
) {
  const params = new URLSearchParams();
  if (values.q) params.set("q", values.q);
  if (values.category) params.set("category", values.category);
  if (values.minScore != null) params.set("minScore", String(values.minScore));
  if (values.sort && values.sort !== "newest") params.set("sort", values.sort);
  if (values.page && values.page > 1) params.set("page", String(values.page));
  const query = params.toString();
  return `/${locale}/reviews${query ? `?${query}` : ""}`;
}

export default async function ReviewsPage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, "/reviews"));

  const minScoreRaw = Number(sp.minScore);
  const minScore =
    Number.isFinite(minScoreRaw) && sp.minScore ? minScoreRaw : null;
  const sort = parseReviewSort(sp.sort);
  const page = Math.max(1, Number(sp.page || 1) || 1);

  const result = await listPublishedReviews({
    locale,
    category: sp.category,
    q: sp.q,
    minScore,
    sort,
    page,
    pageSize: 24,
  }).catch(() => ({
    reviews: [],
    total: 0,
    page: 1,
    pageSize: 24,
    totalPages: 1,
    sort: "newest" as const,
    category: null,
    q: null,
    minScore: null,
    categories: [],
  }));

  const pagePath = `/${locale}/reviews`;

  return (
    <div className="igz-container py-10 md:py-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Tests" : "Reviews",
              url: pageUrl,
            },
          ]),
          itemListJsonLd({
            name: isDe ? "Alle Produkttests" : "All product reviews",
            url: pageUrl,
            items: result.reviews.map((review, index) => ({
              position: index + 1,
              name: review.title,
              url: absoluteUrl(
                localizedPath(locale, `/produkt/${review.product.slug}`),
              ),
            })),
          }),
          aeoAnswerJsonLd({
            question: isDe
              ? "Wo finde ich alle IGZ Produkttests?"
              : "Where can I find all IGZ product reviews?",
            answer: isDe
              ? `Hier findest du ${result.total} veröffentlichte Amazon-Tests mit IGZ-Score, Filtern und Sortierung.`
              : `Here you can browse ${result.total} published Amazon tests with IGZ score, filters and sorting.`,
            url: pageUrl,
            locale,
          }),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: isDe ? "Tests" : "Reviews" },
        ]}
      />

      <div className="max-w-3xl">
        <p className="font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
          {t("reviewsPage.kicker")}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
          {t("reviewsPage.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t("reviewsPage.subtitle", { count: result.total })}
        </p>
        <div className="mt-6">
          <AeoAnswerBlock
            eyebrow={t("product.directAnswer")}
            answer={
              isDe
                ? `IGZ veröffentlicht ausführliche Amazon-Produkttests mit redaktionellem Score, Pros/Cons und Fazit. Aktuell ${result.total} freigegebene Berichte.`
                : `IGZ publishes long-form Amazon product tests with editorial scores, pros/cons and verdicts. Currently ${result.total} published reports.`
            }
            takeawaysTitle={t("product.keyTakeaways")}
            takeaways={
              isDe
                ? [
                    "Filtern nach Kategorie und Mindest-Score",
                    "Sortieren nach Datum, Preis oder Amazon-Rating",
                    "Jeder Test verlinkt zur Kategorie und zu Amazon",
                  ]
                : [
                    "Filter by category and minimum score",
                    "Sort by date, price or Amazon rating",
                    "Every test links to its category and Amazon",
                  ]
            }
          />
        </div>
      </div>

      <div className="mt-8">
        <ReviewsToolbar
          actionHref={pagePath}
          categories={result.categories.map((category) => ({
            slug: category.slug,
            label: locale === "en" ? category.nameEn : category.nameDe,
          }))}
          values={{
            q: result.q || "",
            category: result.category || "",
            minScore:
              result.minScore != null ? String(Math.floor(result.minScore)) : "",
            sort: result.sort,
          }}
          labels={{
            search: t("reviewsPage.filterSearch"),
            searchPlaceholder: t("reviewsPage.filterSearchPlaceholder"),
            category: t("reviewsPage.filterCategory"),
            allCategories: t("reviewsPage.filterAllCategories"),
            minScore: t("reviewsPage.filterMinScore"),
            anyScore: t("reviewsPage.filterAnyScore"),
            sort: t("reviewsPage.filterSort"),
            apply: t("reviewsPage.filterApply"),
            reset: t("reviewsPage.filterReset"),
            sortNewest: t("reviewsPage.sortNewest"),
            sortOldest: t("reviewsPage.sortOldest"),
            sortScoreDesc: t("reviewsPage.sortScoreDesc"),
            sortScoreAsc: t("reviewsPage.sortScoreAsc"),
            sortPriceAsc: t("reviewsPage.sortPriceAsc"),
            sortPriceDesc: t("reviewsPage.sortPriceDesc"),
            sortRatingDesc: t("reviewsPage.sortRatingDesc"),
            sortTitleAsc: t("reviewsPage.sortTitleAsc"),
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {t("reviewsPage.results", {
            count: result.total,
            page: result.page,
            pages: result.totalPages,
          })}
        </p>
        {result.category ? (
          <p>
            {t("reviewsPage.activeCategory")}:{" "}
            <span className="font-medium text-primary">
              {locale === "en"
                ? result.categories.find((c) => c.slug === result.category)
                    ?.nameEn || result.category
                : result.categories.find((c) => c.slug === result.category)
                    ?.nameDe || result.category}
            </span>
          </p>
        ) : null}
      </div>

      {result.reviews.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-muted-foreground">{t("reviewsPage.empty")}</p>
          <Link
            href={pagePath}
            className="mt-4 inline-flex text-sm font-semibold text-secondary hover:underline"
          >
            {t("reviewsPage.filterReset")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {result.reviews.map((review) => {
            const categoryLabel =
              locale === "en"
                ? review.product.category.nameEn
                : review.product.category.nameDe;
            const dateLabel = review.publishedAt
              ? review.publishedAt.toLocaleDateString(
                  locale === "en" ? "en-US" : "de-DE",
                  { year: "numeric", month: "short", day: "numeric" },
                )
              : null;

            return (
              <div key={review.articleId} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Link
                    href={buildHref(locale, {
                      ...result,
                      category: review.product.category.slug,
                      page: 1,
                    })}
                    className="rounded-full bg-secondary/10 px-2.5 py-1 font-semibold text-secondary"
                  >
                    {categoryLabel}
                  </Link>
                  {dateLabel ? (
                    <span className="text-muted-foreground">{dateLabel}</span>
                  ) : null}
                </div>
                <ProductCard
                  href={`/${locale}/produkt/${review.product.slug}`}
                  title={review.title}
                  productId={review.product.id}
                  imageUrl={review.product.imageUrl}
                  imageMimeType={review.product.imageMimeType}
                  score={review.product.editorialScore}
                  price={review.product.price?.toString() ?? null}
                  currency={review.product.currency}
                  locale={locale}
                  ctaLabel={t("cta.amazon")}
                  ctaSublabel={t("cta.amazonSubline")}
                  ctaHref={productOutHref(
                    {
                      asin: review.product.asin,
                      affiliateUrl: review.product.affiliateUrl,
                      productUrl: review.product.productUrl,
                    },
                    locale,
                    pagePath,
                  )}
                  readLabel={t("category.readReview")}
                  amazonOverlayLabel={t("product.imageOverlay")}
                />
                {review.excerpt ? (
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {review.excerpt}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {result.totalPages > 1 ? (
        <nav
          aria-label={t("reviewsPage.pagination")}
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
        >
          {result.page > 1 ? (
            <Link
              href={buildHref(locale, {
                q: result.q,
                category: result.category,
                minScore: result.minScore,
                sort: result.sort,
                page: result.page - 1,
              })}
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:border-secondary"
            >
              {t("reviewsPage.prev")}
            </Link>
          ) : null}

          <span className="px-2 text-sm text-muted-foreground">
            {result.page} / {result.totalPages}
          </span>

          {result.page < result.totalPages ? (
            <Link
              href={buildHref(locale, {
                q: result.q,
                category: result.category,
                minScore: result.minScore,
                sort: result.sort,
                page: result.page + 1,
              })}
              className="rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary hover:border-secondary"
            >
              {t("reviewsPage.next")}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
