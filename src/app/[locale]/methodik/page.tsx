import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
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
        ? "Editorial methodology & testing standards"
        : "Redaktionelle Methodik & Teststandards",
    description:
      locale === "en"
        ? "How IGZ creates product comparisons, scores and AI-assisted reviews for search and answer engines."
        : "So erstellt IGZ Produktvergleiche, Scores und KI-gestützte Testberichte für Suche und Answer Engines.",
    pathWithoutLocale: "/methodik",
  });
}

export default async function MethodologyPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const pageUrl = absoluteUrl(localizedPath(locale, "/methodik"));

  const isDe = locale === "de";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Methodik" : "Methodology",
              url: pageUrl,
            },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: isDe ? "Redaktionelle Methodik" : "Editorial methodology",
            url: pageUrl,
            inLanguage: locale,
            about: "Product review methodology",
          },
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: isDe ? "Methodik" : "Methodology" },
        ]}
      />

      <h1 className="mb-4 text-3xl font-bold tracking-tight">
        {isDe ? "Redaktionelle Methodik" : "Editorial methodology"}
      </h1>
      <p className="aeo-direct-answer mb-8 text-lg text-zinc-700">
        {isDe
          ? "Wir kombinieren Amazon-Produktdaten, redaktionelle Kriterien und KI-gestützte Auswertung – ohne erfundene Labormessungen."
          : "We combine Amazon product data, editorial criteria and AI-assisted analysis — without invented lab measurements."}
      </p>

      <div className="prose-article space-y-6 font-serif text-zinc-700">
        <section>
          <h2>{isDe ? "1. Datenbasis" : "1. Data basis"}</h2>
          <p>
            {isDe
              ? "Produktdaten (Titel, Preis, Rating, Features, Bilder) kommen aus der RapidAPI Real-Time Amazon Data und werden in unserer Postgres-Datenbank gecacht. Seitenaufrufe triggern keine Live-API-Calls."
              : "Product data (title, price, rating, features, images) comes from RapidAPI Real-Time Amazon Data and is cached in Postgres. Page views never trigger live API calls."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "2. Testbericht-Erstellung" : "2. Review creation"}</h2>
          <p>
            {isDe
              ? "Ausführliche Testberichte werden mit OpenRouter generiert und gegen ein Quality-Gate geprüft (Länge, Pros/Cons, Direktantwort, Takeaways). Der Ton orientiert sich an Alltagsszenarien statt Marketingfloskeln."
              : "Long-form reviews are generated with OpenRouter and checked against a quality gate (length, pros/cons, direct answer, takeaways). The tone follows real-world scenarios instead of marketing fluff."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "3. Score-Modell" : "3. Score model"}</h2>
          <p>
            {isDe
              ? "Der redaktionelle Score (0–10) berücksichtigt Preis-Leistung, Verarbeitung, Alltagstauglichkeit und Langzeitnutzen. Amazon-Sterne fließen als Signal ein, ersetzen aber nicht die redaktionelle Bewertung."
              : "The editorial score (0–10) considers value, build quality, everyday usability and longevity. Amazon stars are a signal, not a replacement for editorial judgment."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "4. Nutzererfahrungen" : "4. User experiences"}</h2>
          <p>
            {isDe
              ? "Nutzer können eigene Erfahrungsberichte einreichen. Diese werden vor der Veröffentlichung geprüft. Zusätzlich gibt es klar gekennzeichnete KI-gestützte Erfahrungsstimmen. Keine verifizierten Amazon-Käufe."
              : "Users can submit their own experience reports. These are reviewed before publishing. There are also clearly labeled AI-assisted experience notes. Not verified Amazon purchases."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "5. Transparenz & Affiliate" : "5. Transparency & affiliates"}</h2>
          <p>
            {isDe
              ? "Amazon-Links sind Affiliate-Links. Provisionen beeinflussen nicht die Rangfolge in Vergleichstabellen. Aktualisierungsdaten werden je Produkt ausgewiesen."
              : "Amazon links are affiliate links. Commissions do not determine ranking in comparison tables. Update timestamps are shown per product."}
          </p>
        </section>
      </div>
    </div>
  );
}
