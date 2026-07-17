import Link from "next/link";
import { getTranslations } from "next-intl/server";

type Props = {
  locale: string;
};

export async function SiteFooter({ locale }: Props) {
  const t = await getTranslations();

  return (
    <footer className="mt-16 border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-zinc-600 md:flex-row md:items-center md:justify-between">
        <p>
          © {new Date().getFullYear()} {t("site.name")}. {t("footer.rights")}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href={`/${locale}/impressum`} className="hover:text-zinc-900">
            {t("nav.imprint")}
          </Link>
          <Link href={`/${locale}/datenschutz`} className="hover:text-zinc-900">
            {t("nav.privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
