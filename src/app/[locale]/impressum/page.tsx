import Link from "next/link";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ImprintPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isDe = locale === "de";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">
        {isDe ? "Impressum" : "Imprint"}
      </h1>
      <div className="space-y-6 text-sm leading-relaxed text-zinc-700">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-900">
            {isDe
              ? "Angaben gemäß § 5 DDG"
              : "Information according to § 5 DDG (Germany)"}
          </h2>
          <p>
            Michel Fritzsch
            <br />
            Emilienstr. 15
            <br />
            99817 Eisenach
            <br />
            {isDe ? "Deutschland" : "Germany"}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-900">
            {isDe ? "Vertreten durch" : "Represented by"}
          </h2>
          <p>Michel Fritzsch</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-900">
            {isDe
              ? "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV"
              : "Responsible for content according to § 18 Abs. 2 MStV"}
          </h2>
          <p>
            Michel Fritzsch
            <br />
            Emilienstr. 15
            <br />
            99817 Eisenach
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-900">
            {isDe ? "Kontakt / Produkt zum Test" : "Contact / product testing"}
          </h2>
          <p>
            {isDe ? (
              <>
                Produktvorschläge und Musteranfragen bitte über das{" "}
                <Link
                  href={`/${locale}/kontakt`}
                  className="text-blue-700 hover:underline"
                >
                  Kontaktformular
                </Link>
                . Bitte keine Muster ohne vorherige Absprache senden.
              </>
            ) : (
              <>
                Please use the{" "}
                <Link
                  href={`/${locale}/kontakt`}
                  className="text-blue-700 hover:underline"
                >
                  contact form
                </Link>{" "}
                for product suggestions and sample offers. Do not ship samples
                without prior agreement.
              </>
            )}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-900">
            {isDe ? "Online-Streitbeilegung" : "Online dispute resolution"}
          </h2>
          <p>
            {isDe ? (
              <>
                Die Europäische Kommission stellt eine Plattform zur
                Online-Streitbeilegung (OS) bereit:{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                . Wir sind nicht verpflichtet und nicht bereit, an
                Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </>
            ) : (
              <>
                The European Commission provides a platform for online dispute
                resolution (ODR):{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr/
                </a>
                . We are neither obliged nor willing to participate in dispute
                resolution proceedings before a consumer arbitration board.
              </>
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
