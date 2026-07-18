import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BarcodeScanner } from "@/components/barcode/barcode-scanner";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t("scanner.title"),
    description: t("scanner.subtitle"),
  };
}

export default async function ScannerPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <div className="igz-container py-8 md:py-12">
      <BarcodeScanner
        locale={locale}
        labels={{
          title: t("scanner.title"),
          subtitle: t("scanner.subtitle"),
          startCamera: t("scanner.startCamera"),
          stopCamera: t("scanner.stopCamera"),
          manualTitle: t("scanner.manualTitle"),
          manualPlaceholder: t("scanner.manualPlaceholder"),
          lookup: t("scanner.lookup"),
          lookingUp: t("scanner.lookingUp"),
          permissionHint: t("scanner.permissionHint"),
          tip: t("scanner.tip"),
          foundReview: t("scanner.foundReview"),
          noReview: t("scanner.noReview"),
          amazonOnly: t("scanner.amazonOnly"),
          notFound: t("scanner.notFound"),
          invalid: t("scanner.invalid"),
          quota: t("scanner.quota"),
          openReview: t("scanner.openReview"),
          openAmazon: t("scanner.openAmazon"),
          scanAgain: t("scanner.scanAgain"),
          torchOn: t("scanner.torchOn"),
          torchOff: t("scanner.torchOff"),
        }}
      />
    </div>
  );
}
