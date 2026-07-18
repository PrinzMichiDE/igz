import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CategoryCard } from "@/components/layout/category-card";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
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
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  return buildPageMetadata({
    locale,
    title:
      locale === "en"
        ? "All product categories"
        : "Alle Produktkategorien",
    description:
      locale === "en"
        ? "Browse every IGZ comparison category with product counts and cover images."
        : "Alle IGZ-Vergleichskategorien mit Produktanzahl und Vorschaubildern.",
    pathWithoutLocale: "/kategorien",
  });
}

export default async function CategoriesIndexPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, "/kategorien"));

  const categories = await prisma.category
    .findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { nameDe: "asc" },
    })
    .catch(() => []);

  return (
    <div className="igz-container py-10 md:py-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: isDe ? "Kategorien" : "Categories",
              url: pageUrl,
            },
          ]),
          itemListJsonLd({
            name: isDe ? "Alle Produktkategorien" : "All product categories",
            url: pageUrl,
            items: categories.map((category, index) => ({
              position: index + 1,
              name: locale === "en" ? category.nameEn : category.nameDe,
              url: absoluteUrl(
                localizedPath(locale, `/kategorie/${category.slug}`),
              ),
            })),
          }),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: isDe ? "Kategorien" : "Categories" },
        ]}
      />

      <div className="mt-6 max-w-3xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
          {t("categoriesPage.title")}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {t("categoriesPage.subtitle")}
        </p>
        <p className="mt-2 text-sm text-muted">
          {categories.length} {t("categoriesPage.countLabel")}
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="mt-10 text-muted-foreground">{t("categoriesPage.empty")}</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              href={`/${locale}/kategorie/${category.slug}`}
              title={locale === "en" ? category.nameEn : category.nameDe}
              description={
                locale === "en"
                  ? category.descriptionEn
                  : category.descriptionDe
              }
              count={category._count.products}
              countLabel={t("categoriesPage.productsLabel")}
              slug={category.slug}
              categoryId={category.id}
              imageUrl={category.imageUrl}
              imageMimeType={category.imageMimeType}
            />
          ))}
        </div>
      )}
    </div>
  );
}
