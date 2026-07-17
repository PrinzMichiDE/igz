import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

type Props = {
  locale: string;
};

export async function SiteHeader({ locale }: Props) {
  const t = await getTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${locale}`} className="font-bold tracking-tight text-zinc-900">
          {t("site.name")}
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-600 lg:flex">
          <Link href={`/${locale}`} className="hover:text-zinc-900">
            {t("nav.home")}
          </Link>
          <Link href={`/${locale}/bestenlisten`} className="hover:text-zinc-900">
            {t("nav.bestLists")}
          </Link>
          <Link href={`/${locale}/methodik`} className="hover:text-zinc-900">
            {t("nav.methodology")}
          </Link>
          <Link href={`/${locale}/ueber-uns`} className="hover:text-zinc-900">
            {t("nav.about")}
          </Link>
        </nav>
        <LocaleSwitcher />
      </div>
    </header>
  );
}
