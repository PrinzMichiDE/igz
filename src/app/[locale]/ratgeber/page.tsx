import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { listPublishedAdviceGuides } from "@/lib/ratgeber/list-guides";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  return buildPageMetadata({
    locale,
    title: locale === "en" ? "Guides & buying advice" : "Ratgeber & Kaufhilfen",
    description:
      locale === "en"
        ? "Practical IGZ guides on choosing products – criteria, mistakes to avoid and checklists."
        : "Praxisnahe IGZ-Ratgeber zur Produktauswahl – Kriterien, Fehlkäufe und Checklisten.",
    pathWithoutLocale: "/ratgeber",
  });
}

export default async function RatgeberIndexPage({
  params,
  searchParams,
}: Props) {
  const { locale: localeParam } = await params;
  const sp = await searchParams;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, "/ratgeber"));
  const page = Math.max(1, Number(sp.page || 1) || 1);

  const { items, totalArticles, totalPages } = await listPublishedAdviceGuides({
    locale,
    page,
  }).catch(() => ({
    items: [],
    totalArticles: 0,
    totalPages: 1,
    page: 1,
    pageSize: 18,
  }));

  return (
    <div className="igz-container py-10 md:py-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Ratgeber" : "Guides",
              url: pageUrl,
            },
          ]),
          items.length
            ? itemListJsonLd({
                name: isDe ? "IGZ Ratgeber" : "IGZ Guides",
                url: pageUrl,
                items: items.slice(0, 24).map((item, index) => ({
                  position: index + 1,
                  name: item.title,
                  url: absoluteUrl(localizedPath(locale, item.hrefPath)),
                })),
              })
            : null,
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: t("nav.guides") },
        ]}
      />

      <p className="mt-6 font-display text-sm font-medium tracking-[0.18em] text-secondary uppercase">
        {t("guidesPage.kicker")}
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
        {t("guidesPage.title")}
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
        {t("guidesPage.subtitle", { count: totalArticles })}
      </p>

      {items.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">{t("guidesPage.empty")}</p>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={`${item.source}-${item.slug}`}
              href={`/${locale}${item.hrefPath}`}
              className="igz-card igz-card-hover flex flex-col p-5"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary">
                <span>
                  {item.source === "niche"
                    ? t("guidesPage.badgeNiche")
                    : t("guidesPage.badgeEditorial")}
                </span>
                {item.categoryName ? (
                  <span className="text-muted">· {item.categoryName}</span>
                ) : null}
              </div>
              <h2 className="mt-3 font-display text-xl font-semibold text-primary">
                {item.title}
              </h2>
              {item.excerpt ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {item.excerpt}
                </p>
              ) : null}
              <span className="mt-auto pt-4 text-sm font-semibold text-secondary">
                {t("guidesPage.readMore")} →
              </span>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav
          className="mt-10 flex items-center justify-between gap-3"
          aria-label={t("guidesPage.pagination")}
        >
          {page > 1 ? (
            <Link
              href={`/${locale}/ratgeber?page=${page - 1}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            >
              {t("guidesPage.prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted-foreground">
            {t("guidesPage.pageOf", { page, pages: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={`/${locale}/ratgeber?page=${page + 1}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            >
              {t("guidesPage.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
