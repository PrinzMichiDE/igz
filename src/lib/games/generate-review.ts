import { openRouterChatJson } from "@/lib/ai/openrouter";
import type { ReviewContent } from "@/lib/content-types";
import { prisma } from "@/lib/db/prisma";
import type { GameStoreLink } from "@/lib/igdb/client";
import { slugify } from "@/lib/utils";
import type { Game, Locale } from "@prisma/client";

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
      typeof (item as GameStoreLink).key === "string" &&
      typeof (item as GameStoreLink).url === "string",
  );
}

function gameContextBlock(game: Game, locale: Locale) {
  const genres = asStringArray(game.genresJson);
  const platforms = asStringArray(game.platformsJson);
  const developers = asStringArray(game.developersJson);
  const publishers = asStringArray(game.publishersJson);
  const stores = asStoreLinks(game.storeLinksJson);
  const isDe = locale === "de";

  return [
    `Title: ${game.name}`,
    `IGDB ID: ${game.igdbId}`,
    game.releaseDate
      ? `Release: ${game.releaseDate.toISOString().slice(0, 10)}`
      : null,
    game.igdbRating != null
      ? `IGDB rating: ${game.igdbRating.toFixed(1)}/10 (${game.igdbRatingCount ?? 0})`
      : null,
    genres.length ? `Genres: ${genres.join(", ")}` : null,
    platforms.length ? `Platforms: ${platforms.join(", ")}` : null,
    developers.length ? `Developers: ${developers.join(", ")}` : null,
    publishers.length ? `Publishers: ${publishers.join(", ")}` : null,
    stores.length
      ? `Storefronts: ${stores.map((s) => `${s.label} (${s.url})`).join("; ")}`
      : null,
    game.summary
      ? `${isDe ? "Kurzbeschreibung" : "Summary"}: ${game.summary}`
      : null,
    game.storyline
      ? `${isDe ? "Storyline (Spoiler möglich)" : "Storyline (may spoil)"}: ${game.storyline.slice(0, 1200)}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function reviewPrompt(locale: Locale) {
  const isDe = locale === "de";
  return {
    system: isDe
      ? `Du bist eine Spiele-Redaktion und schreibst ausführliche, ehrliche Videospiel-Reviews auf Deutsch.
Antworte NUR als JSON-Objekt. Keine erfundenen Benchmarks/FPS. Keine Spoiler der Hauptstory.
Kennzeichne klar, dass es eine KI-Einschätzung auf Basis öffentlicher IGDB-Daten ist.
Score 0–10. Genau 7 Abschnitte mit diesen Headings:
1. Erster Eindruck
2. Gameplay & Spielspaß
3. Technik & Bedienung
4. Inhalt & Spielzeit
5. Preis-Leistung & Plattformen
6. Schwächen & Kritik
7. Kaufempfehlung`
      : `You are a games desk writing long-form, honest video game reviews in English.
Reply ONLY as a JSON object. No invented benchmarks/FPS. Avoid major story spoilers.
Be clear this is an AI assessment based on public IGDB data.
Score 0–10. Exactly 7 sections with these headings:
1. First impressions
2. Gameplay & fun
3. Tech & controls
4. Content & playtime
5. Value & platforms
6. Weaknesses & criticism
7. Buying recommendation`,
    userPrefix: isDe
      ? "Erstelle einen ausführlichen Videospiel-Test als JSON mit Feldern: title, excerpt, seoTitle, seoDescription, score, testingPeriod, directAnswer, keyTakeaways (3–5), scoreBreakdown {overall,value,quality,usability,longevity}, decisionGuide {buyIf[], skipIf[]}, pros[], cons[], bestFor[], notFor[], verdict, sections[{heading,body}], faq[{question,answer}]."
      : "Create a long-form video game review as JSON with fields: title, excerpt, seoTitle, seoDescription, score, testingPeriod, directAnswer, keyTakeaways (3–5), scoreBreakdown {overall,value,quality,usability,longevity}, decisionGuide {buyIf[], skipIf[]}, pros[], cons[], bestFor[], notFor[], verdict, sections[{heading,body}], faq[{question,answer}].",
  };
}

export async function generateGameReviewContent(game: Game, locale: Locale) {
  const prompt = reviewPrompt(locale);
  return openRouterChatJson<ReviewContent>({
    temperature: 0.45,
    maxTokens: 4500,
    messages: [
      { role: "system", content: prompt.system },
      {
        role: "user",
        content: `${prompt.userPrefix}\n\nIGDB game data:\n${gameContextBlock(game, locale)}`,
      },
    ],
  });
}

async function uniqueReviewSlug(base: string, locale: Locale, gameId: string) {
  const cleaned = slugify(base) || `game-review-${gameId.slice(0, 8)}`;
  let candidate = cleaned;
  let i = 2;
  while (true) {
    const existing = await prisma.gameReview.findUnique({
      where: { slug_locale: { slug: candidate, locale } },
      select: { gameId: true },
    });
    if (!existing || existing.gameId === gameId) return candidate;
    candidate = `${cleaned}-${i}`;
    i += 1;
  }
}

export async function persistGameReview(options: {
  game: Game;
  locale: Locale;
  content: ReviewContent;
}) {
  const { game, locale, content } = options;
  const title =
    content.title?.trim() ||
    (locale === "de" ? `${game.name} Test & Review` : `${game.name} review`);
  const slug = await uniqueReviewSlug(
    content.seoTitle || title || game.slug,
    locale,
    game.id,
  );
  const score =
    typeof content.score === "number"
      ? content.score
      : typeof content.scoreBreakdown?.overall === "number"
        ? content.scoreBreakdown.overall
        : null;

  const review = await prisma.gameReview.upsert({
    where: { gameId_locale: { gameId: game.id, locale } },
    create: {
      gameId: game.id,
      locale,
      status: "published",
      title,
      slug,
      excerpt: content.excerpt || content.directAnswer || content.verdict || null,
      seoTitle: content.seoTitle || title,
      seoDescription:
        content.seoDescription || content.excerpt || content.directAnswer || null,
      contentJson: content as object,
      overallScore: score,
      publishedAt: new Date(),
    },
    update: {
      status: "published",
      title,
      slug,
      excerpt: content.excerpt || content.directAnswer || content.verdict || null,
      seoTitle: content.seoTitle || title,
      seoDescription:
        content.seoDescription || content.excerpt || content.directAnswer || null,
      contentJson: content as object,
      overallScore: score,
      publishedAt: new Date(),
    },
  });

  await prisma.jobRun.create({
    data: {
      type: "generate_game_review",
      status: "succeeded",
      message: `Game review ${locale} for IGDB ${game.igdbId} (${game.slug})`,
      finishedAt: new Date(),
      metricsJson: {
        gameId: game.id,
        igdbId: game.igdbId,
        reviewId: review.id,
        locale,
        score,
      },
    },
  });

  return review;
}

export async function generateAndPublishGameReview(options: {
  game: Game;
  locale: Locale;
}) {
  const content = await generateGameReviewContent(options.game, options.locale);
  return persistGameReview({
    game: options.game,
    locale: options.locale,
    content,
  });
}
