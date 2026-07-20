import { prisma } from "@/lib/db/prisma";
import {
  fetchIgdbGameById,
  fetchPopularIgdbGames,
  normalizeIgdbGame,
  type IgdbGame,
} from "@/lib/igdb/client";
import { slugify } from "@/lib/utils";
import type { Locale } from "@prisma/client";

async function uniqueGameSlug(base: string, igdbId: number) {
  const cleaned = slugify(base) || `game-${igdbId}`;
  let candidate = cleaned;
  let i = 2;
  while (true) {
    const existing = await prisma.game.findUnique({
      where: { slug: candidate },
      select: { igdbId: true },
    });
    if (!existing || existing.igdbId === igdbId) return candidate;
    candidate = `${cleaned}-${i}`;
    i += 1;
  }
}

export async function upsertGameFromIgdb(igdbGame: IgdbGame) {
  const normalized = normalizeIgdbGame(igdbGame);
  const slug = await uniqueGameSlug(
    normalized.slug || normalized.name,
    normalized.igdbId,
  );

  return prisma.game.upsert({
    where: { igdbId: normalized.igdbId },
    create: {
      igdbId: normalized.igdbId,
      slug,
      name: normalized.name,
      summary: normalized.summary,
      storyline: normalized.storyline,
      coverUrl: normalized.coverUrl,
      releaseDate: normalized.releaseDate,
      igdbRating: normalized.igdbRating,
      igdbRatingCount: normalized.igdbRatingCount,
      genresJson: normalized.genres,
      platformsJson: normalized.platforms,
      developersJson: normalized.developers,
      publishersJson: normalized.publishers,
      screenshotsJson: normalized.screenshots,
      videosJson: normalized.videos,
      websitesJson: normalized.websites,
      storeLinksJson: normalized.storeLinks,
      rawIgdbJson: normalized.raw as object,
    },
    update: {
      name: normalized.name,
      summary: normalized.summary,
      storyline: normalized.storyline,
      coverUrl: normalized.coverUrl,
      releaseDate: normalized.releaseDate,
      igdbRating: normalized.igdbRating,
      igdbRatingCount: normalized.igdbRatingCount,
      genresJson: normalized.genres,
      platformsJson: normalized.platforms,
      developersJson: normalized.developers,
      publishersJson: normalized.publishers,
      screenshotsJson: normalized.screenshots,
      videosJson: normalized.videos,
      websitesJson: normalized.websites,
      storeLinksJson: normalized.storeLinks,
      rawIgdbJson: normalized.raw as object,
    },
  });
}

export async function upsertGameByIgdbId(igdbId: number) {
  const game = await fetchIgdbGameById(igdbId);
  if (!game) {
    throw new Error(`IGDB game not found: ${igdbId}`);
  }
  return upsertGameFromIgdb(game);
}

/**
 * Pick popular IGDB games that do not yet have a published review in locale.
 */
export async function pickGamesForDailyReviews(options: {
  locale: Locale;
  count: number;
}) {
  const reviewed = await prisma.gameReview.findMany({
    where: { locale: options.locale, status: "published" },
    select: { game: { select: { igdbId: true } } },
  });
  const reviewedIgdbIds = new Set(reviewed.map((row) => row.game.igdbId));

  const candidates = await fetchPopularIgdbGames({
    limit: Math.max(options.count * 6, 50),
    excludeIds: [...reviewedIgdbIds],
  });

  const picked: IgdbGame[] = [];
  for (const candidate of candidates) {
    if (picked.length >= options.count) break;
    if (reviewedIgdbIds.has(candidate.id)) continue;
    picked.push(candidate);
  }

  if (picked.length < options.count) {
    const pending = await prisma.game.findMany({
      where: {
        reviews: {
          none: { locale: options.locale, status: "published" },
        },
      },
      orderBy: [{ igdbRating: "desc" }, { releaseDate: "desc" }],
      take: options.count * 2,
    });
    for (const game of pending) {
      if (picked.length >= options.count) break;
      if (picked.some((p) => p.id === game.igdbId)) continue;
      if (reviewedIgdbIds.has(game.igdbId)) continue;
      const fresh = await fetchIgdbGameById(game.igdbId);
      if (fresh) picked.push(fresh);
    }
  }

  return picked.slice(0, options.count);
}
