import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { prisma } from "@/lib/db/prisma";
import { asBuyingGuideContent } from "@/lib/content-types";
import type { AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;

  const category = await prisma.category.findUnique({ where: { slug } }).catch(() => null);
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

  return {
    title: article?.seoTitle || article?.title || "Kaufberatung",
    description: article?.seoDescription || article?.excerpt || undefined,
  };
}

export default async function BuyingGuidePage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();

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

  const products = await prisma.product.findMany({
    where: { categoryId: category.id },
    orderBy: [{ editorialScore: "desc" }],
    take: 8,
  });

  const productByAsin = new Map(products.map((p) => [p.asin, p]));

  return (
    <div className="igz-container py-10 md:py-14">
      <nav className="text-sm text-muted">
        <Link href={`/${locale}`} className="hover:text-secondary">
          {t("nav.home")}
        </Link>
        <span className="mx-2">›</span>
        <Link href={`/${locale}/kategorie/${slug}`} className="hover:text-secondary">
          {categoryName}
        </Link>
        <span className="mx-2">›</span>
        <span className="text-primary">{t("guide.badge")}</span>
      </nav>

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
              <li key={item} className="rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm">
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
