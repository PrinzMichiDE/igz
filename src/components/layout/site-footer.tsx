import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

export async function SiteFooter({ locale }: Props) {
  const t = await getTranslations();

  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-zinc-600">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <p>
            © {new Date().getFullYear()} {t("site.name")}. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={`/${locale}/bestenlisten`} className="hover:text-zinc-900">
              {t("nav.bestLists")}
            </Link>
            <Link href={`/${locale}/methodik`} className="hover:text-zinc-900">
              {t("nav.methodology")}
            </Link>
            <Link href={`/${locale}/ueber-uns`} className="hover:text-zinc-900">
              {t("nav.about")}
            </Link>
            <Link href={`/${locale}/impressum`} className="hover:text-zinc-900">
              {t("nav.imprint")}
            </Link>
            <Link href={`/${locale}/datenschutz`} className="hover:text-zinc-900">
              {t("nav.privacy")}
            </Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
          <a href="/llms.txt" className="hover:text-zinc-800">
            llms.txt
          </a>
          <a href="/ai.txt" className="hover:text-zinc-800">
            ai.txt
          </a>
          <a href="/sitemap.xml" className="hover:text-zinc-800">
            sitemap.xml
          </a>
          <a href="/feed.xml" className="hover:text-zinc-800">
            RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
