import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AiChatWidget } from "@/components/chat/ai-chat-widget";
import { ScannerFab } from "@/components/barcode/scanner-fab";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations();
  const suggestions = t.raw("chat.suggestions") as string[];

  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} className="flex min-h-screen flex-col">
        <SiteHeader locale={locale} />
        <main className="flex-1">{children}</main>
        <SiteFooter locale={locale} />
        <ScannerFab
          href={`/${locale}/scanner`}
          label={t("scanner.fab")}
        />
        <AiChatWidget
          locale={locale}
          categorySlug="bluetooth-kopfhoerer"
          labels={{
            title: t("chat.title"),
            subtitle: t("chat.subtitle"),
            placeholder: t("chat.placeholder"),
            send: t("chat.send"),
            open: t("chat.open"),
            thinking: t("chat.thinking"),
            error: t("chat.error"),
            suggestions: Array.isArray(suggestions) ? suggestions : [],
          }}
        />
      </div>
    </NextIntlClientProvider>
  );
}
