import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">
        {locale === "en" ? "Privacy Policy" : "Datenschutz"}
      </h1>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
        <p>
          {locale === "en"
            ? "This page is a placeholder privacy policy. Add your GDPR-compliant text before production use."
            : "Diese Seite ist ein Platzhalter. Ergänze vor dem Produktivbetrieb eine DSGVO-konforme Datenschutzerklärung."}
        </p>
        <p>
          {locale === "en"
            ? "We use an external PostgreSQL database and third-party APIs (RapidAPI, OpenRouter) to operate the service."
            : "Wir nutzen eine externe PostgreSQL-Datenbank sowie Drittanbieter-APIs (RapidAPI, OpenRouter) zum Betrieb der Plattform."}
        </p>
      </div>
    </div>
  );
}
