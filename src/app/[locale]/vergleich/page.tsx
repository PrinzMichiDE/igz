import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaButton } from "@/components/affiliate/cta-button";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { ProsCons } from "@/components/content/pros-cons";
import { FeatureComparisonMatrix } from "@/components/comparison/feature-comparison-matrix";
import { MultiComparePicker } from "@/components/comparison/multi-compare-picker";
import { SpecComparisonMatrix } from "@/components/comparison/spec-comparison-matrix";
import { ScoreBadge } from "@/components/product/score-badge";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { asReviewContent } from "@/lib/content-types";
import { collectFeatureList } from "@/lib/product-metadata";
import { buildFeatureMatrix } from "@/lib/product-ranking";
import { buildSpecMatrix } from "@/lib/product-tech/matrix";
import { productOutHref } from "@/lib/product-links";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import { formatPrice } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

const MAX_COMPARE = 4;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ a?: string; b?: string; slugs?: string }>;
};

function parseCompareSlugs(searchParams: {
  a?: string;
  b?: string;
  slugs?: string;
}): string[] {
  if (searchParams.slugs) {
    return [
      ...new Set(
        searchParams.slugs
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ].slice(0, MAX_COMPARE);
  }
  const pair = [searchParams.a, searchParams.b].filter(
    (value): value is string => Boolean(value),
  );
  return [...new Set(pair)].slice(0, MAX_COMPARE);
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale = localeParam as AppLocale;
  const slugs = parseCompareSlugs(sp);
  const isDe = locale === "de";

  if (slugs.length >= 2) {
    const products = await prisma.product
      .findMany({
        where: { slug: { in: slugs } },
        select: { slug: true, title: true },
      })
      .catch(() => []);
    const ordered = slugs
      .map((slug) => products.find((product) => product.slug === slug))
      .filter((product): product is NonNullable<typeof product> =>
        Boolean(product),
      );
    if (ordered.length >= 2) {
      const names = ordered.map((product) => product.title);
      return buildPageMetadata({
        locale,
        title: isDe
          ? `${names.join(" vs. ")} – Vergleich`
          : `${names.join(" vs. ")} – Comparison`,
        description: isDe
          ? `Side-by-Side-Vergleich von ${names.join(", ")}: IGZ-Scores, Specs, Preis und Pros/Cons.`
          : `Side-by-side comparison of ${names.join(", ")}: IGZ scores, specs, price and pros/cons.`,
        pathWithoutLocale: "/vergleich",
        noIndex: true,
      });
    }
  }

  return buildPageMetadata({
    locale,
    title: isDe
      ? "Zwei bis vier Produkte im Direktvergleich"
      : "Compare two to four products side by side",
    description: isDe
      ? "Wähle 2–4 Amazon-Produkte und vergleiche IGZ-Scores, Specs, Preis sowie Pros/Cons – inkl. Nur-Unterschiede-Ansicht."
      : "Pick 2–4 Amazon products and compare IGZ scores, specs, price and pros/cons — including a differences-only view.",
    pathWithoutLocale: "/vergleich",
    noIndex: Boolean(sp.a || sp.b || sp.slugs),
  });
}

export default async function ComparePage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pagePath = `/${locale}/vergleich`;
  const isDe = locale === "de";
  const numberLocale = locale === "en" ? "en-US" : "de-DE";
  const slugs = parseCompareSlugs(sp);

  const categories = await prisma.category
    .findMany({
      include: {
        products: {
          orderBy: [{ editorialScore: "desc" }],
          take: 12,
        },
      },
      orderBy: { nameDe: "asc" },
    })
    .catch(() => []);

  if (slugs.length < 2) {
    const selected = sp.a
      ? await prisma.product.findUnique({
          where: { slug: sp.a },
          include: { category: true },
        })
      : null;
    const pageUrl = absoluteUrl(localizedPath(locale, "/vergleich"));
    const hubOptions = categories
      .flatMap((category) => category.products)
      .slice(0, 36)
      .map((product) => ({ slug: product.slug, title: product.title }));

    return (
      <div className="igz-container py-10 md:py-14">
        <JsonLd
          data={[
            organizationJsonLd(locale),
            websiteJsonLd(locale),
            aeoAnswerJsonLd({
              question: isDe
                ? "Wie vergleiche ich Produkte bei IGZ?"
                : "How do I compare products on IGZ?",
              answer: isDe
                ? "Wähle 2–4 Produkte – IGZ zeigt Scores, Specs, Preis und Pros/Cons im Side-by-Side-Vergleich inklusive Nur-Unterschiede-Ansicht."
                : "Pick 2–4 products — IGZ shows scores, specs, price and pros/cons side by side, including a differences-only view.",
              url: pageUrl,
              locale,
            }),
          ]}
        />
        <h1 className="font-display text-4xl font-bold text-primary">
          {t("compare.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {t("compare.subtitle")}
        </p>
        <div className="mt-6 max-w-3xl">
          <AeoAnswerBlock
            eyebrow={t("product.directAnswer")}
            answer={
              isDe
                ? "Der IGZ-Direktvergleich stellt Specs und redaktionelle Bewertungen von bis zu vier Amazon-Produkten gegenüber – ideal vor der Kaufentscheidung."
                : "The IGZ head-to-head puts specs and editorial scores of up to four Amazon products side by side — ideal before you buy."
            }
            takeawaysTitle={t("product.keyTakeaways")}
            takeaways={
              isDe
                ? [
                    "2–4 Modelle aus einer Kategorie wählen",
                    "„Nur Unterschiede“ blendet identische Specs aus",
                    "SEO-Duells weiter unter /vergleich/a-vs-b",
                  ]
                : [
                    "Pick 2–4 models from a category",
                    "Differences-only hides identical specs",
                    "SEO duels remain at /vergleich/a-vs-b",
                  ]
            }
          />
        </div>

        <div className="mt-8">
          <MultiComparePicker
            locale={locale}
            options={hubOptions}
            initialSlugs={sp.a ? [sp.a] : []}
            labels={{
              title: t("compare.multiTitle"),
              helper: t("compare.multiHelper"),
              selected: t("category.multiCompareSelected"),
              cta: t("category.multiCompareCta"),
              clear: t("category.multiCompareClear"),
              maxHint: t("category.multiCompareMaxHint"),
            }}
          />
        </div>

        {selected ? (
          <div className="mt-8 igz-card p-5">
            <p className="text-sm text-muted-foreground">
              {t("compare.pickSecond")}
            </p>
            <p className="mt-1 font-semibold text-primary">{selected.title}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                await prisma.product.findMany({
                  where: { categoryId: selected.categoryId, slug: { not: sp.a } },
                  take: 8,
                })
              ).map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/vergleich?slugs=${sp.a},${product.slug}`}
                  className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-secondary hover:text-secondary"
                >
                  {product.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 space-y-8">
          {categories.map((category) => (
            <section key={category.id}>
              <h2 className="font-display text-xl font-semibold text-primary">
                {locale === "en" ? category.nameEn : category.nameDe}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/${locale}/vergleich?a=${product.slug}`}
                    className="rounded-full border border-border px-3 py-1.5 text-sm hover:border-secondary hover:text-secondary"
                  >
                    {product.title}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    include: {
      category: true,
      articles: {
        where: { type: "review", locale, status: "published" },
        take: 1,
      },
    },
  });

  const ordered = slugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product),
    );

  if (ordered.length < 2) notFound();

  const reviews = ordered.map((product) =>
    asReviewContent(product.articles[0]?.contentJson),
  );

  const matrix = buildFeatureMatrix(
    ordered.map((product) => ({
      id: product.id,
      title: product.title,
      features: collectFeatureList(product.features),
      ctaHref: productOutHref(product, locale, pagePath),
    })),
  );
  const specMatrix = buildSpecMatrix(
    ordered.map((product) => ({
      id: product.id,
      title: product.title,
      specsJson: product.specsJson,
      features: product.features,
      ctaHref: productOutHref(product, locale, pagePath),
    })),
    locale,
  );

  const names = ordered.map((product) => product.title);
  const seoPairHref =
    ordered.length === 2
      ? `/${locale}/vergleich/${ordered[0].slug}-vs-${ordered[1].slug}`
      : null;

  return (
    <div className="igz-container py-10 md:py-14">
      <h1 className="font-display text-4xl font-bold text-primary">
        {t("compare.headToHead")}
      </h1>
      <p className="mt-3 text-muted-foreground">{names.join(" vs. ")}</p>
      <p className="mt-2 text-sm text-muted">
        {isDe
          ? `${ordered.length} Produkte im Vergleich · Unterschiede hervorgehoben`
          : `${ordered.length} products compared · differences highlighted`}
      </p>

      <div
        className={`mt-8 grid gap-4 ${
          ordered.length <= 2
            ? "lg:grid-cols-2"
            : ordered.length === 3
              ? "lg:grid-cols-3"
              : "sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {ordered.map((product, index) => {
          const review = reviews[index];
          return (
            <article key={product.id} className="igz-card p-5">
              <h2 className="font-display text-lg font-semibold text-primary">
                <Link
                  href={`/${locale}/produkt/${product.slug}`}
                  className="hover:text-secondary"
                >
                  {product.title}
                </Link>
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <ScoreBadge
                  score={product.editorialScore ?? product.rating}
                  size="md"
                  label={t("product.score")}
                />
                <p className="text-xl font-bold text-primary">
                  {formatPrice(
                    product.price?.toString(),
                    product.currency,
                    numberLocale,
                  )}
                </p>
              </div>
              {typeof product.rating === "number" ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  ★ {product.rating.toFixed(1)} Amazon
                  {product.reviewCount
                    ? ` (${product.reviewCount.toLocaleString(numberLocale)})`
                    : ""}
                </p>
              ) : null}
              <div className="mt-4">
                <CtaButton
                  href={productOutHref(product, locale, pagePath)}
                  label={t("cta.amazon")}
                  sublabel={t("cta.amazonSubline")}
                  variant="amazon"
                  size="sm"
                />
              </div>
              {ordered.length <= 2 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <ProsCons
                    prosTitle={t("product.theGood")}
                    consTitle={t("product.theBad")}
                    pros={(review.pros || []).slice(0, 4)}
                    cons={(review.cons || []).slice(0, 3)}
                  />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {specMatrix.columns.length > 0 ? (
        <SpecComparisonMatrix
          title={t("compare.specMatrix")}
          featureLabel={t("category.featureColumn")}
          missingLabel={t("category.specMissing")}
          ctaLabel={t("cta.amazon")}
          columns={specMatrix.columns}
          rows={specMatrix.rows}
          hideIdenticalLabel={t("category.hideIdentical")}
          showAllLabel={t("category.showAllSpecs")}
          differencesHint={t("category.differencesHint")}
        />
      ) : (
        <FeatureComparisonMatrix
          title={t("compare.featureMatrix")}
          featureLabel={t("category.featureColumn")}
          yesLabel={t("category.featureYes")}
          noLabel={t("category.featureNo")}
          ctaLabel={t("cta.amazon")}
          features={matrix.features}
          rows={matrix.rows}
        />
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          href={`/${locale}/vergleich`}
          className="text-sm font-semibold text-secondary hover:underline"
        >
          {t("compare.pickAnother")}
        </Link>
        {seoPairHref ? (
          <Link
            href={seoPairHref}
            className="text-sm text-muted-foreground hover:underline"
          >
            {t("compare.seoPairHint")}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
