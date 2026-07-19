import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "@/components/layout/brand-logo";

type Props = {
  locale: string;
};

export async function SiteFooter({ locale }: Props) {
  const t = await getTranslations();

  const links = [
    { href: `/${locale}/ueber-uns`, label: t("footer.about") },
    {
      href: `/${locale}/redaktionelle-richtlinien`,
      label: t("footer.editorial"),
    },
    { href: `/${locale}/methodik`, label: t("footer.methodology") },
    { href: `/${locale}/datenschutz`, label: t("nav.privacy") },
    { href: `/${locale}/kontakt`, label: t("footer.contact") },
    { href: `/${locale}/impressum`, label: t("nav.imprint") },
  ];

  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="igz-container py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <BrandLogo href={`/${locale}`} />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {t("footer.disclaimer")}
            </p>
            <p className="mt-4 text-xs text-muted">
              © {new Date().getFullYear()} {t("site.name")}. {t("footer.rights")}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
