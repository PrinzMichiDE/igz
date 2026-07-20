import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { AiContentDisclosure } from "@/components/content/ai-content-disclosure";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { asBuyingGuideContent } from "@/lib/content-types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;

  const category = await prisma.category
    .findUnique({ where: { slug } })
    .catch(() => null);
  if (!category) return { title: "Buying guide" };

  const article = await prisma.article
    .findFirst({
      where: {
        categoryId: category.id,
        type: "buying_guide",
        locale: appLocale,
        status: "published",
      },
    })
    .catch(() => null);

  const categoryName =
    appLocale === "en" ? category.nameEn : category.nameDe;
  const title =
    article?.seoTitle ||
    article?.title ||
    (appLocale === "en"
      ? `${categoryName} buying guide`
      : `${categoryName} Kaufberatung`);
  const description =
    article?.seoDescription ||
    article?.excerpt ||
    (appLocale === "en"
      ? `Practical buying guide for ${categoryName}: criteria, mistakes and checklist.`
      : `Praxisnahe Kaufberatung für ${categoryName}: Kriterien, Fehlkäufe und Checkliste.`);

  return buildPageMetadata({
    locale: appLocale,
    title,
    description,
    pathWithoutLocale: `/kategorie/${slug}/kaufberatung`,
    type: "article",
    publishedTime: article?.publishedAt,
    modifiedTime: article?.updatedAt,
  });
}

export default async function BuyingGuidePage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";

  const category = await prisma.category
    .findUnique({ where: { slug } })
    .catch(() => null);

  if (!category) notFound();

  const article = await prisma.article
    .findFirst({
      where: {
        categoryId: category.id,
        type: "buying_guide",
        locale,
        status: "published",
      },
    })
    .catch(() => null);

  if (!article) notFound();

  const content = asBuyingGuideContent(article.contentJson);
  const categoryName = locale === "en" ? category.nameEn : category.nameDe;
  const pageUrl = absoluteUrl(
    localizedPath(locale, `/kategorie/${slug}/kaufberatung`),
  );
  const directAnswer =
    content.intro?.slice(0, 320) ||
    article.excerpt ||
    (isDe
      ? `Kaufberatung ${categoryName}: worauf du achten solltest, bevor du bestellst.`
      : `Buying guide for ${categoryName}: what to check before you buy.`);

  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
    orderBy: [{ editorialScore: "desc" }],
    take: 8,
  });

  const productByAsin = new Map(products.map((p) => [p.asin, p]));

  return (
    <div className="igz-container py-10 md:py-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: categoryName,
              url: absoluteUrl(localizedPath(locale, `/kategorie/${slug}`)),
            },
            { name: t("guide.badge"), url: pageUrl },
          ]),
          articleJsonLd({
            locale,
            headline: article.title,
            description: article.excerpt || undefined,
            url: pageUrl,
            datePublished: article.publishedAt,
            dateModified: article.updatedAt,
          }),
          aeoAnswerJsonLd({
            question: isDe
              ? `${categoryName} kaufen – worauf achten?`
              : `Buying ${categoryName} – what matters?`,
            answer: directAnswer,
            url: pageUrl,
            locale,
          }),
          faqJsonLd(content.faq || []),
          howToJsonLd({
            name: isDe
              ? `${categoryName} richtig auswählen`
              : `How to choose ${categoryName}`,
            description: article.excerpt || undefined,
            url: pageUrl,
            locale,
            steps: content.checklist || [],
          }),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          {
            label: categoryName,
            href: `/${locale}/kategorie/${slug}`,
          },
          { label: t("guide.badge") },
        ]}
      />

      <p className="mt-6 font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
        {t("guide.badge")}
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
        {article.title}
      </h1>
      {article.excerpt ? (
        <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
          {article.excerpt}
        </p>
      ) : null}

      <div className="mt-6">
        <AeoAnswerBlock
          eyebrow={t("product.directAnswer")}
          answer={directAnswer}
          takeawaysTitle={t("product.keyTakeaways")}
          takeaways={content.keyCriteria?.slice(0, 5) || []}
        />
      </div>

      <section className="prose-article mt-10">
        {content.intro ? <p>{content.intro}</p> : null}
        {content.sections?.map((section) => (
          <div key={section.heading} className="mt-8">
            <h2>{section.heading}</h2>
            {section.body.split("\n\n").map((paragraph) => (
              <p key={paragraph.slice(0, 48)}>{paragraph}</p>
            ))}
          </div>
        ))}
      </section>

      {content.keyCriteria && content.keyCriteria.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-primary">
            {t("guide.keyCriteria")}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {content.keyCriteria.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {content.budgetTiers && content.budgetTiers.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-primary">
            {t("guide.budgetTiers")}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {content.budgetTiers.map((tier) => {
              const product = productByAsin.get(tier.asin);
              return (
                <article key={tier.label} className="igz-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                    {tier.label}
                  </p>
                  <p className="mt-1 text-sm text-muted">{tier.range}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {tier.recommendation}
                  </p>
                  {product ? (
                    <Link
                      href={`/${locale}/produkt/${product.slug}`}
                      className="mt-4 inline-block text-sm font-semibold text-secondary hover:underline"
                    >
                      {product.title} →
                    </Link>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {content.checklist && content.checklist.length > 0 ? (
        <section className="mt-10 igz-card p-6">
          <h2 className="font-display text-xl font-semibold text-primary">
            {t("guide.checklist")}
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            {content.checklist.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <FaqAccordion items={content.faq || []} />

      <AiContentDisclosure
        title={t("disclosure.aiTitle")}
        body={t("disclosure.aiBody")}
        legalNote={t("disclosure.aiLegal")}
        methodologyHref={`/${locale}/methodik`}
        methodologyLabel={t("disclosure.aiMethodology")}
      />

      <div className="mt-10">
        <Link
          href={`/${locale}/kategorie/${slug}`}
          className="text-sm font-semibold text-secondary hover:underline"
        >
          {t("guide.backToComparison")} →
        </Link>
      </div>
    </div>
  );
}
