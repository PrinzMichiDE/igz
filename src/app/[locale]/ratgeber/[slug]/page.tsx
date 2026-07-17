import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { InternalLinks } from "@/components/seo/internal-links";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import {
  BLUETOOTH_HEADPHONES_PAGES,
  getNichePageBySlug,
  getPillarPage,
  NICHE_CATEGORY_SLUG,
} from "@/lib/seo/niche/bluetooth-headphones";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  const page = getNichePageBySlug(slug);
  if (!page || page.kind === "pillar") return { title: "Not found" };

  return buildPageMetadata({
    locale,
    title: locale === "en" ? page.titleEn : page.titleDe,
    description: locale === "en" ? page.descriptionEn : page.descriptionDe,
    pathWithoutLocale: page.path,
    type: "article",
  });
}

export default async function RatgeberPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();

  const page = getNichePageBySlug(slug);
  if (!page || page.kind === "pillar") notFound();

  const pillar = getPillarPage();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, page.path));

  const products = await prisma.product
    .findMany({
      where: { category: { slug: NICHE_CATEGORY_SLUG } },
      orderBy: [{ editorialScore: "desc" }, { rating: "desc" }],
      take: 6,
    })
    .catch(() => []);

  const relatedPages = BLUETOOTH_HEADPHONES_PAGES.filter(
    (item) => item.slug !== page.slug,
  ).slice(0, 6);

  const faq = isDe ? page.faqDe : page.faqEn;
  const takeaways = isDe ? page.keyTakeawaysDe : page.keyTakeawaysEn;
  const directAnswer = isDe ? page.directAnswerDe : page.directAnswerEn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Ratgeber" : "Guides",
              url: absoluteUrl(localizedPath(locale, "/bestenlisten")),
            },
            { name: isDe ? page.h1De : page.h1En, url: pageUrl },
          ]),
          aeoAnswerJsonLd({
            question: isDe ? page.primaryKeywordDe : page.primaryKeywordEn,
            answer: directAnswer,
            url: pageUrl,
            locale,
          }),
          faqJsonLd(faq),
          products.length
            ? itemListJsonLd({
                name: isDe ? page.h1De : page.h1En,
                url: pageUrl,
                items: products.map((product, index) => ({
                  position: index + 1,
                  name: product.title,
                  url: absoluteUrl(
                    localizedPath(locale, `/produkt/${product.slug}`),
                  ),
                })),
              })
            : null,
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: isDe ? "Ratgeber" : "Guides", href: `/${locale}/bestenlisten` },
          { label: isDe ? page.h1De : page.h1En },
        ]}
      />

      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        {isDe ? "Nischen-Ratgeber" : "Niche guide"} ·{" "}
        {isDe ? page.primaryKeywordDe : page.primaryKeywordEn}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
        {isDe ? page.h1De : page.h1En}
      </h1>
      <p className="mt-3 max-w-3xl text-zinc-600">
        {isDe ? page.descriptionDe : page.descriptionEn}
      </p>
      <p className="mt-2 text-sm text-zinc-500">
        {isDe ? "Zielgruppe:" : "Audience:"}{" "}
        {isDe ? page.audienceDe : page.audienceEn}
      </p>

      <div className="mt-6">
        <AffiliateDisclosure text={t("disclosure.short")} />
      </div>

      <div className="mt-6">
        <AeoAnswerBlock
          eyebrow={t("product.directAnswer")}
          answer={directAnswer}
          takeawaysTitle={t("product.keyTakeaways")}
          takeaways={takeaways}
        />
      </div>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-zinc-900">
            {isDe ? "Aktuelle Empfehlungen aus dem Vergleich" : "Current picks from our comparison"}
          </h2>
          <Link
            href={`/${locale}${pillar.path}`}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            {isDe ? pillar.ctaLabelDe : pillar.ctaLabelEn}
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-sm text-zinc-600">{t("home.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                href={`/${locale}/produkt/${product.slug}`}
                title={product.title}
                productId={product.id}
                imageUrl={product.imageUrl}
                imageMimeType={product.imageMimeType}
                score={product.editorialScore ?? product.rating}
                price={product.price?.toString()}
                currency={product.currency}
                locale={locale}
                ctaLabel={t("cta.amazon")}
                ctaHref={product.affiliateUrl || product.productUrl || "#"}
                readLabel={t("category.readReview")}
              />
            ))}
          </div>
        )}
      </section>

      <section className="prose-article mb-10 font-serif text-zinc-700">
        <h2>{isDe ? "So entscheiden wir" : "How we decide"}</h2>
        <p>
          {isDe
            ? "Diese Seite gehört zur Bluetooth-Kopfhörer-Nischenstrategie: eine klare Suchintention, eine Direktantwort und interne Links zum Hauptvergleich. Produktdaten stammen aus dem gecachten Amazon-Bestand; Scores folgen der redaktionellen Methodik."
            : "This page is part of the Bluetooth headphones niche strategy: one clear search intent, a direct answer and internal links to the pillar comparison. Product data comes from the cached Amazon catalog; scores follow our editorial methodology."}
        </p>
        <p>
          <Link href={`/${locale}/methodik`} className="text-blue-700">
            {t("nav.methodology")}
          </Link>
        </p>
      </section>

      <FaqAccordion items={faq} />

      <InternalLinks
        title={t("product.internalLinks")}
        items={[
          {
            href: `/${locale}${pillar.path}`,
            title: isDe ? pillar.h1De : pillar.h1En,
            description: isDe ? pillar.descriptionDe : pillar.descriptionEn,
          },
          ...relatedPages.map((item) => ({
            href: `/${locale}${item.path}`,
            title: isDe ? item.h1De : item.h1En,
            description: isDe ? item.descriptionDe : item.descriptionEn,
          })),
        ]}
      />
    </div>
  );
}
