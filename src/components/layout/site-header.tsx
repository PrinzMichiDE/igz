import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SiteHeaderNav } from "@/components/layout/site-header-nav";

type Props = {
  locale: string;
};

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations();

  const links = [
    {
      href: `/${locale}/kategorien`,
      label: t("nav.categories"),
    },
    {
      href: `/${locale}/reviews`,
      label: t("nav.reviews"),
    },
    {
      href: `/${locale}/spiele`,
      label: t("nav.games"),
    },
    {
      href: `/${locale}/ratgeber`,
      label: t("nav.guides"),
    },
    {
      href: `/${locale}/vergleich`,
      label: t("nav.compare"),
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="igz-container relative flex items-center justify-between gap-3 py-3">
        <BrandLogo href={`/${locale}`} />
        <SiteHeaderNav
          locale={locale}
          links={links}
          searchPlaceholder={t("home.searchPlaceholder")}
          searchButtonLabel={t("home.searchButton")}
          searchHref={`/${locale}/suche`}
          scannerLabel={t("nav.scanner")}
          dealsLabel={t("nav.deals")}
          menuOpenLabel={t("nav.menuOpen")}
          menuCloseLabel={t("nav.menuClose")}
        />
      </div>
    </header>
  );
}
