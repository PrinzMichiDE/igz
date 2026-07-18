import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CtaButton } from "@/components/affiliate/cta-button";
import { ProsCons } from "@/components/content/pros-cons";
import { FeatureComparisonMatrix } from "@/components/comparison/feature-comparison-matrix";
import { SpecComparisonMatrix } from "@/components/comparison/spec-comparison-matrix";
import { ScoreBadge } from "@/components/product/score-badge";
import { prisma } from "@/lib/db/prisma";
import { asReviewContent } from "@/lib/content-types";
import { collectFeatureList } from "@/lib/product-metadata";
import { buildFeatureMatrix } from "@/lib/product-ranking";
import { buildSpecMatrix } from "@/lib/product-tech/matrix";
import { productOutHref } from "@/lib/product-links";
import { formatPrice } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
};

export default async function ComparePage({ params, searchParams }: Props) {
  const { locale: localeParam } = await params;
  const { a, b } = await searchParams;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pagePath = `/${locale}/vergleich`;

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

  if (!a || !b) {
    const selected = a
      ? await prisma.product.findUnique({ where: { slug: a }, include: { category: true } })
      : null;

    return (
      <div className="igz-container py-10 md:py-14">
        <h1 className="font-display text-4xl font-bold text-primary">
          {t("compare.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("compare.subtitle")}</p>

        {selected ? (
          <div className="mt-8 igz-card p-5">
            <p className="text-sm text-muted-foreground">{t("compare.pickSecond")}</p>
            <p className="mt-1 font-semibold text-primary">{selected.title}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(
                await prisma.product.findMany({
                  where: { categoryId: selected.categoryId, slug: { not: a } },
                  take: 8,
                })
              ).map((product) => (
                <Link
                  key={product.id}
                  href={`/${locale}/vergleich?a=${a}&b=${product.slug}`}
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

  const [productA, productB] = await Promise.all([
    prisma.product.findUnique({
      where: { slug: a },
      include: {
        category: true,
        articles: {
          where: { type: "review", locale, status: "published" },
          take: 1,
        },
      },
    }),
    prisma.product.findUnique({
      where: { slug: b },
      include: {
        category: true,
        articles: {
          where: { type: "review", locale, status: "published" },
          take: 1,
        },
      },
    }),
  ]);

  if (!productA || !productB) notFound();

  const reviewA = asReviewContent(productA.articles[0]?.contentJson);
  const reviewB = asReviewContent(productB.articles[0]?.contentJson);
  const numberLocale = locale === "en" ? "en-US" : "de-DE";

  const matrix = buildFeatureMatrix([
    {
      id: productA.id,
      title: productA.title,
      features: collectFeatureList(productA.features),
      ctaHref: productOutHref(productA, locale, pagePath),
    },
    {
      id: productB.id,
      title: productB.title,
      features: collectFeatureList(productB.features),
      ctaHref: productOutHref(productB, locale, pagePath),
    },
  ]);
  const specMatrix = buildSpecMatrix(
    [
      {
        id: productA.id,
        title: productA.title,
        specsJson: productA.specsJson,
        features: productA.features,
        ctaHref: productOutHref(productA, locale, pagePath),
      },
      {
        id: productB.id,
        title: productB.title,
        specsJson: productB.specsJson,
        features: productB.features,
        ctaHref: productOutHref(productB, locale, pagePath),
      },
    ],
    locale,
  );

  const products = [productA, productB];

  return (
    <div className="igz-container py-10 md:py-14">
      <h1 className="font-display text-4xl font-bold text-primary">
        {t("compare.headToHead")}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {productA.title} vs. {productB.title}
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {products.map((product, index) => {
          const review = index === 0 ? reviewA : reviewB;
          return (
            <article key={product.id} className="igz-card p-5">
              <h2 className="font-display text-lg font-semibold text-primary">
                <Link href={`/${locale}/produkt/${product.slug}`} className="hover:text-secondary">
                  {product.title}
                </Link>
              </h2>
              <div className="mt-3 flex items-center gap-4">
                <ScoreBadge
                  score={product.editorialScore ?? product.rating}
                  size="md"
                  label={t("product.score")}
                />
                <p className="text-xl font-bold text-primary">
                  {formatPrice(product.price?.toString(), product.currency, numberLocale)}
                </p>
              </div>
              <div className="mt-4">
                <CtaButton
                  href={productOutHref(product, locale, pagePath)}
                  label={t("cta.amazon")}
                  sublabel={t("cta.amazonSubline")}
                  variant="amazon"
                  size="sm"
                />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <ProsCons
                  prosTitle={t("product.theGood")}
                  consTitle={t("product.theBad")}
                  pros={(review.pros || []).slice(0, 4)}
                  cons={(review.cons || []).slice(0, 3)}
                />
              </div>
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

      <div className="mt-8">
        <Link href={`/${locale}/vergleich`} className="text-sm font-semibold text-secondary hover:underline">
          {t("compare.pickAnother")}
        </Link>
      </div>
    </div>
  );
}
