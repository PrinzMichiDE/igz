import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/seo/jsonld";
import { absoluteUrl, getSiteName, localizedPath } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  const name = getSiteName(locale);
  return buildPageMetadata({
    locale,
    title: locale === "en" ? `About ${name}` : `Über ${name}`,
    description:
      locale === "en"
        ? `${name} publishes independent Amazon comparisons and in-depth reviews for humans and answer engines.`
        : `${name} veröffentlicht unabhängige Amazon-Vergleiche und ausführliche Tests für Menschen und Answer Engines.`,
    pathWithoutLocale: "/ueber-uns",
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const name = getSiteName(locale);
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, "/ueber-uns"));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            { name: isDe ? "Über uns" : "About", url: pageUrl },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: isDe ? `Über ${name}` : `About ${name}`,
            url: pageUrl,
            inLanguage: locale,
          },
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: isDe ? "Über uns" : "About" },
        ]}
      />

      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        {isDe ? `Über ${name}` : `About ${name}`}
      </h1>
      <p className="aeo-direct-answer mb-8 text-lg text-zinc-700">
        {isDe
          ? `${name} hilft bei Kaufentscheidungen mit klaren Vergleichen, ausführlichen Testberichten und transparenten Affiliate-Hinweisen.`
          : `${name} helps with buying decisions through clear comparisons, in-depth reviews and transparent affiliate disclosures.`}
      </p>

      <div className="prose-article space-y-5 font-serif text-zinc-700">
        <p>
          {isDe
            ? "Unsere Inhalte sind SEO- und AEO-optimiert: strukturierte Daten, Direktantworten und zitierfähige Faktenblöcke erleichtern die Auffindbarkeit in Google sowie in Systemen wie Gemini, ChatGPT und Perplexity."
            : "Our content is optimized for SEO and AEO: structured data, direct answers and citation-friendly fact blocks improve discoverability in Google and systems like Gemini, ChatGPT and Perplexity."}
        </p>
        <p>
          {isDe ? (
            <>
              Mehr zur Arbeitsweise findest du auf der{" "}
              <Link href={`/${locale}/methodik`} className="text-blue-700">
                Methodik-Seite
              </Link>{" "}
              und in den{" "}
              <Link
                href={`/${locale}/redaktionelle-richtlinien`}
                className="text-blue-700"
              >
                redaktionellen Richtlinien
              </Link>
              . Aktuelle Bestenlisten gibt es unter{" "}
              <Link href={`/${locale}/bestenlisten`} className="text-blue-700">
                Bestenlisten
              </Link>
              .
            </>
          ) : (
            <>
              Learn more on our{" "}
              <Link href={`/${locale}/methodik`} className="text-blue-700">
                methodology page
              </Link>{" "}
              and in the{" "}
              <Link
                href={`/${locale}/redaktionelle-richtlinien`}
                className="text-blue-700"
              >
                editorial guidelines
              </Link>
              . Current best-of lists live at{" "}
              <Link href={`/${locale}/bestenlisten`} className="text-blue-700">
                best lists
              </Link>
              .
            </>
          )}
        </p>
      </div>
    </div>
  );
}
