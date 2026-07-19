import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { getEditorialGuidelineSections } from "@/lib/editorial/guidelines-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  return buildPageMetadata({
    locale,
    title:
      locale === "en"
        ? "Editorial guidelines"
        : "Redaktionelle Richtlinien",
    description:
      locale === "en"
        ? "How IGZ writes product tests: independence, AI-assisted editing, review structure, scoring and affiliate rules."
        : "So schreibt IGZ Produkttests: Unabhängigkeit, KI-gestützte Redaktion, Teststruktur, Scores und Affiliate-Regeln.",
    pathWithoutLocale: "/redaktionelle-richtlinien",
  });
}

export default async function EditorialGuidelinesPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(
    localizedPath(locale, "/redaktionelle-richtlinien"),
  );
  const sections = getEditorialGuidelineSections(isDe ? "de" : "en");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe
                ? "Redaktionelle Richtlinien"
                : "Editorial guidelines",
              url: pageUrl,
            },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: isDe
              ? "Redaktionelle Richtlinien"
              : "Editorial guidelines",
            url: pageUrl,
            inLanguage: locale,
            about: "Editorial guidelines for product reviews",
          },
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          {
            label: isDe
              ? "Redaktionelle Richtlinien"
              : "Editorial guidelines",
          },
        ]}
      />

      <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
        {isDe ? "Redaktionelle Richtlinien" : "Editorial guidelines"}
      </h1>
      <p className="aeo-direct-answer mb-4 text-lg text-zinc-700">
        {isDe
          ? "IGZ-Tests sollen klar, fair und praxisnah sein – mit fester Struktur, nachvollziehbaren Scores und sichtbaren Affiliate-Hinweisen."
          : "IGZ reviews should be clear, fair and practical — with a fixed structure, transparent scores and visible affiliate disclosures."}
      </p>
      <p className="mb-8 text-sm text-zinc-600">
        {isDe
          ? "Stand: Juli 2026. Diese Richtlinien gelten für Testberichte, Vergleiche und Bestenlisten."
          : "Updated: July 2026. These guidelines apply to reviews, comparisons and best-of lists."}
      </p>

      <nav
        aria-label={isDe ? "Inhaltsverzeichnis" : "Table of contents"}
        className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50 p-5"
      >
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-zinc-500 uppercase">
          {isDe ? "Inhalt" : "Contents"}
        </p>
        <ol className="space-y-1.5 text-sm">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-blue-700 hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10 text-sm leading-relaxed text-zinc-700">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900">
              {section.title}
            </h2>
            <div>{section.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
