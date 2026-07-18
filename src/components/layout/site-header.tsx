import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ScanBarcode, Tag } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { HeroSearch } from "@/components/layout/hero-search";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { prisma } from "@/lib/db/prisma";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  locale: string;
};

async function safeNavCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { nameDe: "asc" },
      take: 6,
    });
  } catch {
    return [];
  }
}

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations();
  const appLocale = locale as AppLocale;
  const categories = await safeNavCategories();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="igz-container flex items-center justify-between gap-4 py-3">
        <BrandLogo href={`/${locale}`} />

        <nav className="hidden items-center gap-6 xl:flex">
          {categories.map((category) => {
            const label =
              appLocale === "en" ? category.nameEn : category.nameDe;
            return (
              <Link
                key={category.id}
                href={`/${locale}/kategorie/${category.slug}`}
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                {label}
              </Link>
            );
          })}
          <Link
            href={`/${locale}/vergleich`}
            className="text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            {t("nav.compare")}
          </Link>
          <Link
            href={`/${locale}/scanner`}
            className="text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            {t("nav.scanner")}
          </Link>
          <Link
            href={`/${locale}#reviews`}
            className="text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            {t("nav.reviews")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <HeroSearch
            placeholder={t("home.searchPlaceholder")}
            buttonLabel={t("home.searchButton")}
            actionHref={`/${locale}/suche`}
            variant="compact"
          />
          <Link
            href={`/${locale}/scanner`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-primary transition hover:border-secondary xl:hidden"
            aria-label={t("nav.scanner")}
          >
            <ScanBarcode className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={`/${locale}/deals`}
            className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-container sm:inline-flex"
          >
            <Tag className="h-4 w-4" aria-hidden />
            {t("nav.deals")}
          </Link>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
