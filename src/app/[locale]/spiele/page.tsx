import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const isDe = appLocale === "de";
  return buildPageMetadata({
    locale: appLocale,
    title: isDe ? "Videospiel-Reviews" : "Video game reviews",
    description: isDe
      ? "Ausführliche IGDB-basierte Videospiel-Tests mit Trailer, Screenshots und Store-Links."
      : "In-depth IGDB-based video game reviews with trailers, screenshots and storefront links.",
    pathWithoutLocale: "/spiele",
  });
}

export default async function GamesIndexPage({ params }: Props) {
  const { locale: localeParam } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";
  const pageUrl = absoluteUrl(localizedPath(locale, "/spiele"));

  const reviews = await prisma.gameReview
    .findMany({
      where: { locale, status: "published" },
      include: { game: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 60,
    })
    .catch(() => []);

  return (
    <div className="igz-container py-10 md:py-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            { name: t("nav.games"), url: pageUrl },
          ]),
          itemListJsonLd({
            name: t("gamesPage.title"),
            description: t("gamesPage.subtitle"),
            url: pageUrl,
            items: reviews.map((review, index) => ({
              position: index + 1,
              name: review.title,
              url: absoluteUrl(
                localizedPath(locale, `/spiele/${review.game.slug}`),
              ),
            })),
          }),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: t("nav.games") },
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="text-sm font-semibold tracking-[0.14em] text-secondary uppercase">
          {t("gamesPage.kicker")}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold text-primary">
          {t("gamesPage.title")}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t("gamesPage.subtitle")}
        </p>
      </header>

      {reviews.length === 0 ? (
        <p className="mt-10 text-muted-foreground">{t("gamesPage.empty")}</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <Link
              key={review.id}
              href={`/${locale}/spiele/${review.game.slug}`}
              className="igz-card group overflow-hidden transition hover:border-secondary/40"
            >
              <div className="relative aspect-[16/10] bg-surface-muted">
                {review.game.coverUrl ? (
                  <Image
                    src={review.game.coverUrl}
                    alt={review.game.name}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-semibold text-primary">
                    {review.game.name}
                  </h2>
                  {typeof review.overallScore === "number" ? (
                    <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-bold text-secondary">
                      {review.overallScore.toFixed(1)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {review.excerpt ||
                    (isDe ? "Zum ausführlichen Test →" : "Read the full review →")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
