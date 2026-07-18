import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getPrivacySections } from "@/lib/legal/privacy-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  return buildPageMetadata({
    locale,
    title: locale === "en" ? "Privacy Policy" : "Datenschutzerklärung",
    description:
      locale === "en"
        ? "GDPR privacy policy for IGZ Vergleich: hosting, cookies, forms, AI chat, Amazon affiliate links."
        : "DSGVO-Datenschutzerklärung von IGZ Vergleich: Hosting, Cookies, Formulare, KI-Chat, Amazon-Affiliate-Links.",
    pathWithoutLocale: "/datenschutz",
  });
}

export default async function PrivacyPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const isDe = locale === "de";
  const sections = getPrivacySections(isDe ? "de" : "en");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
        {isDe ? "Datenschutzerklärung" : "Privacy Policy"}
      </h1>
      <p className="mb-8 text-sm text-zinc-600">
        {isDe
          ? "Informationen zur Verarbeitung personenbezogener Daten gemäß DSGVO und TDDDG."
          : "Information on the processing of personal data under the GDPR and German TDDDG."}
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
