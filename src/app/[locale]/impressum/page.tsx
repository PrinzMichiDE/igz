import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ImprintPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">
        {locale === "en" ? "Imprint" : "Impressum"}
      </h1>
      <div className="space-y-3 text-sm leading-relaxed text-zinc-700">
        <p>
          {locale === "en"
            ? "Please replace this placeholder with your legal company details before going live."
            : "Bitte ersetze diesen Platzhalter vor dem Go-Live durch deine rechtlichen Angaben."}
        </p>
        <p>IGZ Vergleich</p>
        <p>E-Mail: contact@example.com</p>
      </div>
    </div>
  );
}
