import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductTestRequestForm } from "@/components/contact/product-test-request-form";
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
        ? "Contact – suggest a product for testing"
        : "Kontakt – Produkt zum Test vorschlagen",
    description:
      locale === "en"
        ? "Send Amazon product suggestions or sample offers to the IGZ editorial desk for independent testing."
        : "Sende Amazon-Produktvorschläge oder Musterangebote an die IGZ-Redaktion für einen unabhängigen Test.",
    pathWithoutLocale: "/kontakt",
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, "/kontakt"));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Kontakt" : "Contact",
              url: pageUrl,
            },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: isDe
              ? "Kontakt – Produkt zum Test vorschlagen"
              : "Contact – suggest a product for testing",
            url: pageUrl,
            inLanguage: locale,
          },
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: isDe ? "Kontakt" : "Contact" },
        ]}
      />

      <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
        {isDe
          ? "Produkt zum Test vorschlagen"
          : "Suggest a product for testing"}
      </h1>
      <p className="aeo-direct-answer mb-6 text-lg text-zinc-700">
        {isDe
          ? "Du hast ein Amazon-Produkt, das wir testen sollen? Schick uns ASIN/Link und kurz, warum es relevant ist – optional mit Musterversand."
          : "Have an Amazon product we should test? Send the ASIN/link and a short note why it matters — optionally with a sample shipment."}
      </p>

      <div className="mb-8 space-y-3 text-sm leading-relaxed text-zinc-700">
        <p>
          {isDe
            ? "Wir prüfen jede Einsendung redaktionell. Es gibt keinen Anspruch auf Veröffentlichung, Ranking oder bezahlte Platzierung. Affiliate-Provisionen beeinflussen unsere Scores nicht."
            : "Every submission is reviewed editorially. There is no entitlement to publication, ranking or paid placement. Affiliate commissions do not influence our scores."}
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            {isDe
              ? "Am besten: Amazon.de-Link oder ASIN"
              : "Best: Amazon.de link or ASIN"}
          </li>
          <li>
            {isDe
              ? "Kurz beschreiben, was getestet werden soll (Alltag, Zielgruppe, Besonderheit)"
              : "Briefly describe what should be tested (daily use, audience, special angle)"}
          </li>
          <li>
            {isDe
              ? "Musterversand nur nach Rückfrage und an eine von uns genannte Adresse"
              : "Sample shipping only after we confirm and provide a shipping address"}
          </li>
        </ul>
        <p>
          {isDe ? (
            <>
              Mehr zu Stil und Unabhängigkeit in den{" "}
              <Link
                href={`/${locale}/redaktionelle-richtlinien`}
                className="text-blue-700 hover:underline"
              >
                redaktionellen Richtlinien
              </Link>{" "}
              und der{" "}
              <Link
                href={`/${locale}/methodik`}
                className="text-blue-700 hover:underline"
              >
                Methodik
              </Link>
              .
            </>
          ) : (
            <>
              More on voice and independence in our{" "}
              <Link
                href={`/${locale}/redaktionelle-richtlinien`}
                className="text-blue-700 hover:underline"
              >
                editorial guidelines
              </Link>{" "}
              and{" "}
              <Link
                href={`/${locale}/methodik`}
                className="text-blue-700 hover:underline"
              >
                methodology
              </Link>
              .
            </>
          )}
        </p>
      </div>

      <ProductTestRequestForm
        locale={isDe ? "de" : "en"}
        privacyHref={`/${locale}/datenschutz`}
        labels={{
          name: t("contact.formName"),
          email: t("contact.formEmail"),
          company: t("contact.formCompany"),
          productTitle: t("contact.formProductTitle"),
          amazonUrl: t("contact.formAmazonUrl"),
          asin: t("contact.formAsin"),
          categoryHint: t("contact.formCategory"),
          message: t("contact.formMessage"),
          canShipSample: t("contact.formCanShip"),
          canShipSampleHint: t("contact.formCanShipHint"),
          privacy: t("contact.formPrivacy"),
          submit: t("contact.formSubmit"),
          submitting: t("contact.formSubmitting"),
          success: t("contact.formSuccess"),
          error: t("contact.formError"),
          requiredNote: t("contact.formRequiredNote"),
        }}
      />

      <div className="mt-10 rounded-xl border border-border bg-surface-muted/60 p-5 text-sm text-zinc-700">
        <h2 className="font-display text-base font-semibold text-primary">
          {isDe ? "Postanschrift / Impressum" : "Postal address / imprint"}
        </h2>
        <p className="mt-2">
          Michel Fritzsch
          <br />
          Emilienstr. 15
          <br />
          99817 Eisenach
          <br />
          {isDe ? "Deutschland" : "Germany"}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          {isDe ? (
            <>
              Rechtliche Angaben:{" "}
              <Link
                href={`/${locale}/impressum`}
                className="text-blue-700 hover:underline"
              >
                Impressum
              </Link>
              . Bitte keine Muster ohne vorherige Absprache senden.
            </>
          ) : (
            <>
              Legal notice:{" "}
              <Link
                href={`/${locale}/impressum`}
                className="text-blue-700 hover:underline"
              >
                Imprint
              </Link>
              . Please do not ship samples without prior agreement.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
