import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AffiliateDisclosure } from "@/components/affiliate/disclosure";
import { AiContentDisclosure } from "@/components/content/ai-content-disclosure";
import { AeoAnswerBlock } from "@/components/content/aeo-answer-block";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProsCons } from "@/components/content/pros-cons";
import { GameImageGallery } from "@/components/games/game-image-gallery";
import { GameStoreLinks } from "@/components/games/game-store-links";
import { GameVideoEmbeds } from "@/components/games/game-video-embeds";
import { ScoreBadge } from "@/components/product/score-badge";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { asReviewContent } from "@/lib/content-types";
import { prisma } from "@/lib/db/prisma";
import type { GameStoreLink } from "@/lib/igdb/client";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  aeoAnswerJsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
  extractAeoFields,
  faqJsonLd,
  organizationJsonLd,
} from "@/lib/seo/jsonld";
import { absoluteUrl, localizedPath } from "@/lib/seo/site";
import { formatDate, slugify } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asStoreLinks(value: unknown): GameStoreLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is GameStoreLink =>
      Boolean(item) &&
      typeof item === "object" &&
      typeof (item as GameStoreLink).url === "string" &&
      typeof (item as GameStoreLink).label === "string",
  );
}

function asVideos(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      if (typeof row.id !== "string") return null;
      return {
        id: row.id,
        name: typeof row.name === "string" ? row.name : "Trailer",
        embedUrl: typeof row.embedUrl === "string" ? row.embedUrl : null,
        watchUrl: typeof row.watchUrl === "string" ? row.watchUrl : null,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const appLocale = locale as AppLocale;

  const game = await prisma.game
    .findUnique({
      where: { slug },
      include: {
        reviews: {
          where: { locale: appLocale, status: "published" },
          take: 1,
        },
      },
    })
    .catch(() => null);

  const review = game?.reviews[0];
  if (!game || !review) {
    return { title: "Game" };
  }

  return buildPageMetadata({
    locale: appLocale,
    title: review.seoTitle || review.title,
    description:
      review.seoDescription ||
      review.excerpt ||
      game.summary ||
      review.title,
    pathWithoutLocale: `/spiele/${game.slug}`,
    image: game.coverUrl,
    type: "article",
    publishedTime: review.publishedAt,
    modifiedTime: review.updatedAt,
  });
}

export default async function GameReviewPage({ params }: Props) {
  const { locale: localeParam, slug } = await params;
  const locale = localeParam as AppLocale;
  setRequestLocale(locale);
  const t = await getTranslations();
  const isDe = locale === "de";

  const game = await prisma.game
    .findUnique({
      where: { slug },
      include: {
        reviews: {
          where: { locale, status: "published" },
          take: 1,
        },
      },
    })
    .catch(() => null);

  const review = game?.reviews[0];
  if (!game || !review) notFound();

  const content = asReviewContent(review.contentJson);
  const aeo = extractAeoFields(content);
  const pageUrl = absoluteUrl(localizedPath(locale, `/spiele/${game.slug}`));
  const screenshots = asStringArray(game.screenshotsJson);
  const gallery = [
    ...(game.coverUrl ? [game.coverUrl] : []),
    ...screenshots,
  ];
  const videos = asVideos(game.videosJson);
  const storeLinks = asStoreLinks(game.storeLinksJson);
  const genres = asStringArray(game.genresJson);
  const platforms = asStringArray(game.platformsJson);
  const developers = asStringArray(game.developersJson);
  const publishers = asStringArray(game.publishersJson);
  const score = review.overallScore ?? content.score ?? null;

  const sections = (content.sections || [])
    .filter((section) => section.heading?.trim() && section.body?.trim())
    .map((section, index) => ({
      ...section,
      id: `abschnitt-${slugify(section.heading) || index + 1}`,
    }));

  return (
    <div className="igz-container py-10 md:py-14">
      <JsonLd
        data={[
          organizationJsonLd(locale),
          breadcrumbJsonLd([
            { name: t("nav.home"), url: absoluteUrl(localizedPath(locale)) },
            {
              name: t("nav.games"),
              url: absoluteUrl(localizedPath(locale, "/spiele")),
            },
            { name: review.title, url: pageUrl },
          ]),
          articleJsonLd({
            locale,
            headline: review.title,
            description: review.excerpt || aeo.directAnswer || undefined,
            url: pageUrl,
            image: game.coverUrl,
            datePublished: review.publishedAt,
            dateModified: review.updatedAt,
          }),
          aeo.directAnswer
            ? aeoAnswerJsonLd({
                question: review.title,
                answer: aeo.directAnswer,
                url: pageUrl,
                locale,
              })
            : null,
          faqJsonLd(content.faq || []),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: t("nav.home"), href: `/${locale}` },
          { label: t("nav.games"), href: `/${locale}/spiele` },
          { label: game.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <p className="text-sm font-semibold tracking-[0.14em] text-secondary uppercase">
            {t("gamesPage.reviewBadge")}
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-primary md:text-5xl">
            {review.title}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {game.name}
            {game.releaseDate
              ? ` · ${formatDate(game.releaseDate, locale === "en" ? "en-US" : "de-DE").split(",")[0]}`
              : ""}
          </p>

          <div className="mt-6">
            <AffiliateDisclosure text={t("disclosure.short")} />
          </div>

          <div className="mt-6">
            <GameImageGallery
              images={gallery}
              alt={game.name}
              emptyLabel={t("gamesPage.noImages")}
            />
          </div>

          <div className="mt-6">
            <AeoAnswerBlock
              eyebrow={t("product.directAnswer")}
              answer={
                aeo.directAnswer ||
                content.verdict ||
                review.excerpt ||
                game.summary ||
                game.name
              }
              takeawaysTitle={t("product.keyTakeaways")}
              takeaways={aeo.keyTakeaways}
            />
          </div>

          <GameStoreLinks
            title={t("gamesPage.storeLinks")}
            links={storeLinks}
            emptyLabel={t("gamesPage.noStoreLinks")}
          />

          <GameVideoEmbeds
            title={t("gamesPage.videos")}
            videos={videos}
            emptyLabel={t("gamesPage.noVideos")}
          />

          <section className="prose-article mt-10">
            <h2>{t("product.verdict")}</h2>
            <p>{content.verdict || review.excerpt || game.summary}</p>
          </section>

          <div className="mt-10 space-y-6">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-border bg-surface p-6 md:p-7"
              >
                <p className="text-xs font-semibold tracking-[0.16em] text-secondary uppercase">
                  {isDe
                    ? `Abschnitt ${index + 1} von ${sections.length}`
                    : `Section ${index + 1} of ${sections.length}`}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-primary">
                  {section.heading}
                </h2>
                <div className="prose-article mt-4">
                  {section.body
                    .split(/\n{2,}/)
                    .map((paragraph) => paragraph.trim())
                    .filter(Boolean)
                    .map((paragraph, paragraphIndex) => (
                      <p key={`${section.id}-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-10">
            <ProsCons
              prosTitle={t("product.theGood")}
              consTitle={t("product.theBad")}
              pros={content.pros || []}
              cons={content.cons || []}
            />
          </section>

          <section className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="igz-card p-5">
              <h2 className="font-display text-sm font-semibold text-primary">
                {t("product.bestFor")}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(content.bestFor || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="igz-card p-5">
              <h2 className="font-display text-sm font-semibold text-primary">
                {t("product.notFor")}
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(content.notFor || []).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </section>

          <FaqAccordion items={content.faq || []} />

          <AiContentDisclosure
            title={t("disclosure.aiTitle")}
            body={t("disclosure.aiBody")}
            legalNote={t("disclosure.aiLegal")}
            methodologyHref={`/${locale}/methodik`}
            methodologyLabel={t("disclosure.aiMethodology")}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="igz-card overflow-hidden">
            {game.coverUrl ? (
              <div className="relative aspect-[3/4] bg-surface-muted">
                <Image
                  src={game.coverUrl}
                  alt={game.name}
                  fill
                  className="object-cover"
                  sizes="320px"
                  unoptimized
                />
              </div>
            ) : null}
            <div className="p-5">
              <ScoreBadge
                score={score}
                size="lg"
                label={t("gamesPage.score")}
                showBadge
              />
              {typeof game.igdbRating === "number" ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  IGDB: {game.igdbRating.toFixed(1)}/10
                  {game.igdbRatingCount
                    ? ` · ${game.igdbRatingCount.toLocaleString(locale === "en" ? "en-US" : "de-DE")}`
                    : ""}
                </p>
              ) : null}
              {genres.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              ) : null}
              {platforms.length > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  {platforms.join(" · ")}
                </p>
              ) : null}
              {developers.length > 0 ? (
                <p className="mt-2 text-xs text-muted">
                  {t("gamesPage.developers")}: {developers.join(", ")}
                </p>
              ) : null}
              {publishers.length > 0 ? (
                <p className="mt-1 text-xs text-muted">
                  {t("gamesPage.publishers")}: {publishers.join(", ")}
                </p>
              ) : null}
              <a
                href={`https://www.igdb.com/games/${game.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-xs font-semibold text-secondary hover:underline"
              >
                {t("gamesPage.sourceIgdb")} →
              </a>
            </div>
          </div>

          <GameStoreLinks
            title={t("gamesPage.storeLinks")}
            links={storeLinks}
          />
        </aside>
      </div>
    </div>
  );
}
