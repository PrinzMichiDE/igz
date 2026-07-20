import type { Metadata } from "next";
import Link from "next/link";
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
          ? "Wir kombinieren Amazon-Produktdaten und KI-generierte Auswertung nach festen Kriterien – ohne erfundene Labormessungen und ohne menschliche redaktionelle Freigabe der Texte."
          : "We combine Amazon product data and AI-generated analysis against fixed criteria — without invented lab measurements and without human editorial approval of the copy."}
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
              ? "Ausführliche Testberichte, Vergleiche und Ratgeber werden vollständig mit OpenRouter (KI) generiert und nur gegen ein automatisches Quality-Gate geprüft (Länge, Pros/Cons, Direktantwort, Takeaways) – nicht durch eine menschliche Redaktion. Am Ende jedes Beitrags kennzeichnen wir das gemäß EU AI Act Art. 50. Der Ton orientiert sich an Alltagsszenarien statt Marketingfloskeln. Automatisch erscheinen pro Tag bis zu drei neue Amazon-Tests aus verschiedenen Kategorien."
              : "Long-form reviews, comparisons and guides are generated entirely with OpenRouter (AI) and only checked by an automated quality gate (length, pros/cons, direct answer, takeaways) — not by a human editor. Every article ends with an EU AI Act Art. 50 disclosure. The tone follows real-world scenarios instead of marketing fluff. Automatically we publish up to three new Amazon tests per day from different categories."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "3. Score-Modell" : "3. Score model"}</h2>
          <p>
            {isDe
              ? "Der KI-Score (0–10) berücksichtigt Preis-Leistung, Verarbeitung, Alltagstauglichkeit und Langzeitnutzen. Amazon-Sterne fließen als Signal ein, ersetzen aber nicht die modellbasierte Bewertung."
              : "The AI score (0–10) considers value, build quality, everyday usability and longevity. Amazon stars are a signal, not a replacement for the model-based assessment."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "4. Technisches Datenblatt" : "4. Technical datasheet"}</h2>
          <p>
            {isDe
              ? "Amazon-Details werden per KI in einheitliche Spec-Felder normalisiert (identische Keys je Kategorie). So sind Vergleiche spaltenweise vergleichbar. Unbekannte Werte werden weggelassen – keine erfundenen Labormessungen."
              : "Amazon details are AI-normalized into identical spec fields (stable keys per category) so comparisons line up column by column. Unknown values are omitted — no invented lab measurements."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "5. Bekannte Fehler & Fehlercodes" : "5. Known issues & error codes"}</h2>
          <p>
            {isDe
              ? "Zusätzlich recherchiert die KI öffentlich berichtete Probleme und typische Fehlercodes inkl. erster Schritte. Quellen werden verlinkt, wenn verfügbar. Keine Garantie auf Vollständigkeit; Inhalte sind nicht redaktionell geprüft."
              : "AI also researches publicly reported issues and typical error codes with first remediation steps. Sources are linked when available. Completeness is not guaranteed; content is not editorially reviewed."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "6. Nutzererfahrungen" : "6. User experiences"}</h2>
          <p>
            {isDe
              ? "Nutzer können eigene Erfahrungsberichte einreichen. Diese werden vor der Veröffentlichung geprüft und als Nutzerbericht gekennzeichnet. Zusätzlich erscheinen redaktionelle Erfahrungsberichte aus typischen Nutzungsszenarien. Keine verifizierten Amazon-Käufe."
              : "Users can submit their own experience reports. These are reviewed before publishing and labeled as user reports. Editorial experience notes based on typical usage scenarios may also appear. Not verified Amazon purchases."}
          </p>
        </section>
        <section>
          <h2>{isDe ? "7. Transparenz & Affiliate" : "7. Transparency & affiliates"}</h2>
          <p>
            {isDe
              ? "Amazon-Links sind Affiliate-Links. Provisionen beeinflussen nicht die Rangfolge in Vergleichstabellen. Aktualisierungsdaten werden je Produkt ausgewiesen."
              : "Amazon links are affiliate links. Commissions do not determine ranking in comparison tables. Update timestamps are shown per product."}
          </p>
        </section>
        <section>
          <h2>
            {isDe ? "8. Redaktionelle Richtlinien" : "8. Editorial guidelines"}
          </h2>
          <p>
            {isDe ? (
              <>
                Stil, Verbote, Teststruktur und Unabhängigkeitsregeln sind in den{" "}
                <Link
                  href={`/${locale}/redaktionelle-richtlinien`}
                  className="text-blue-700"
                >
                  redaktionellen Richtlinien
                </Link>{" "}
                festgehalten.
              </>
            ) : (
              <>
                Voice, bans, review structure and independence rules are documented
                in our{" "}
                <Link
                  href={`/${locale}/redaktionelle-richtlinien`}
                  className="text-blue-700"
                >
                  editorial guidelines
                </Link>
                .
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
