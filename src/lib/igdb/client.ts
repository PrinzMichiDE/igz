/**
 * IGDB API client (Twitch OAuth2 client-credentials).
 * Docs: https://api-docs.igdb.com/
 */

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE = "https://api.igdb.com/v4";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

export type IgdbImageRef = { id?: number; image_id?: string; url?: string };
export type IgdbVideoRef = { id?: number; video_id?: string; name?: string };
export type IgdbWebsiteRef = { id?: number; category?: number; url?: string };
export type IgdbExternalGameRef = {
  id?: number;
  category?: number;
  uid?: string;
  url?: string;
  name?: string;
};
export type IgdbNamedRef = { id?: number; name?: string };
export type IgdbCompanyLink = {
  id?: number;
  developer?: boolean;
  publisher?: boolean;
  company?: IgdbNamedRef;
};

export type IgdbGame = {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number;
  rating?: number;
  rating_count?: number;
  cover?: IgdbImageRef;
  screenshots?: IgdbImageRef[];
  videos?: IgdbVideoRef[];
  websites?: IgdbWebsiteRef[];
  external_games?: IgdbExternalGameRef[];
  genres?: IgdbNamedRef[];
  platforms?: IgdbNamedRef[];
  involved_companies?: IgdbCompanyLink[];
  url?: string;
};

export type GameStoreLink = {
  key: string;
  label: string;
  url: string;
};

const WEBSITE_CATEGORY: Record<number, { key: string; label: string }> = {
  1: { key: "official", label: "Official" },
  3: { key: "wikipedia", label: "Wikipedia" },
  6: { key: "twitch", label: "Twitch" },
  9: { key: "youtube", label: "YouTube" },
  13: { key: "steam", label: "Steam" },
  14: { key: "reddit", label: "Reddit" },
  16: { key: "epic", label: "Epic Games Store" },
  17: { key: "gog", label: "GOG" },
  18: { key: "discord", label: "Discord" },
};

const EXTERNAL_CATEGORY: Record<number, { key: string; label: string }> = {
  1: { key: "steam", label: "Steam" },
  5: { key: "gog", label: "GOG" },
  10: { key: "youtube", label: "YouTube" },
  11: { key: "microsoft", label: "Microsoft Store" },
  13: { key: "apple", label: "App Store" },
  14: { key: "twitch", label: "Twitch" },
  15: { key: "android", label: "Google Play" },
  20: { key: "amazon", label: "Amazon" },
  26: { key: "epic", label: "Epic Games Store" },
  28: { key: "youtube", label: "YouTube" },
  31: { key: "xbox", label: "Xbox" },
  36: { key: "playstation", label: "PlayStation Store" },
  37: { key: "playstation", label: "PlayStation Store" },
};

function hostHint(url: string): GameStoreLink | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (host.includes("steampowered.com") || host === "store.steampowered.com") {
      return { key: "steam", label: "Steam", url };
    }
    if (host.includes("ubisoft.com") || host.includes("ubi.com")) {
      return { key: "ubisoft", label: "Ubisoft Connect", url };
    }
    if (host.includes("epicgames.com")) {
      return { key: "epic", label: "Epic Games Store", url };
    }
    if (host.includes("gog.com")) {
      return { key: "gog", label: "GOG", url };
    }
    if (host.includes("xbox.com") || host.includes("microsoft.com")) {
      return { key: "xbox", label: "Xbox / Microsoft Store", url };
    }
    if (host.includes("playstation.com")) {
      return { key: "playstation", label: "PlayStation Store", url };
    }
    if (host.includes("nintendo.com")) {
      return { key: "nintendo", label: "Nintendo eShop", url };
    }
    if (host.includes("ea.com") || host.includes("origin.com")) {
      return { key: "ea", label: "EA App", url };
    }
    if (host.includes("battle.net") || host.includes("blizzard.com")) {
      return { key: "battlenet", label: "Battle.net", url };
    }
    if (host.includes("humblebundle.com")) {
      return { key: "humble", label: "Humble Bundle", url };
    }
  } catch {
    return null;
  }
  return null;
}

export function igdbConfigured() {
  return Boolean(
    process.env.IGDB_CLIENT_ID?.trim() && process.env.IGDB_CLIENT_SECRET?.trim(),
  );
}

async function getAccessToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.IGDB_CLIENT_ID?.trim();
  const clientSecret = process.env.IGDB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "IGDB_CLIENT_ID / IGDB_CLIENT_SECRET missing. Create a Twitch app and enable IGDB.",
    );
  }

  const url = new URL(TWITCH_TOKEN_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("grant_type", "client_credentials");

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    throw new Error(`Twitch OAuth failed ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new Error("Twitch OAuth returned no access_token");
  }

  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + (json.expires_in || 3600) * 1000,
  };
  return tokenCache.accessToken;
}

export async function igdbQuery<T>(
  endpoint: string,
  body: string,
): Promise<T[]> {
  const clientId = process.env.IGDB_CLIENT_ID!.trim();
  const token = await getAccessToken();
  const res = await fetch(`${IGDB_BASE}/${endpoint.replace(/^\//, "")}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`IGDB ${endpoint} failed ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

export function igdbImageUrl(
  imageId: string | null | undefined,
  size:
    | "t_cover_big"
    | "t_screenshot_big"
    | "t_screenshot_huge"
    | "t_1080p"
    | "t_thumb" = "t_cover_big",
) {
  if (!imageId) return null;
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

export function youtubeEmbedUrl(videoId: string | null | undefined) {
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
}

export function youtubeWatchUrl(videoId: string | null | undefined) {
  if (!videoId) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

const GAME_FIELDS = `
fields name,slug,summary,storyline,first_release_date,rating,rating_count,url,
  cover.image_id,cover.url,
  screenshots.image_id,screenshots.url,
  videos.video_id,videos.name,
  websites.category,websites.url,
  external_games.category,external_games.url,external_games.uid,external_games.name,
  genres.name,platforms.name,
  involved_companies.developer,involved_companies.publisher,involved_companies.company.name;
`.replace(/\s+/g, " ").trim();

export async function fetchIgdbGameById(igdbId: number): Promise<IgdbGame | null> {
  const rows = await igdbQuery<IgdbGame>(
    "games",
    `${GAME_FIELDS} where id = ${igdbId};`,
  );
  return rows[0] ?? null;
}

/**
 * Popular mainline games suitable for reviews (no DLC/edition parent).
 */
export async function fetchPopularIgdbGames(options?: {
  limit?: number;
  excludeIds?: number[];
  offset?: number;
}): Promise<IgdbGame[]> {
  const limit = Math.min(Math.max(options?.limit ?? 40, 1), 100);
  const offset = options?.offset ?? 0;
  const exclude = (options?.excludeIds || []).filter((id) => Number.isFinite(id));
  const excludeClause =
    exclude.length > 0 ? ` & id != (${exclude.slice(0, 80).join(",")})` : "";

  return igdbQuery<IgdbGame>(
    "games",
    `${GAME_FIELDS}
where rating != null & rating >= 70 & category = 0 & version_parent = null${excludeClause};
sort rating desc;
limit ${limit};
offset ${offset};`.replace(/\n/g, " "),
  );
}

export function buildStoreLinks(game: IgdbGame): GameStoreLink[] {
  const byKey = new Map<string, GameStoreLink>();

  for (const site of game.websites || []) {
    if (!site.url) continue;
    const mapped = WEBSITE_CATEGORY[site.category ?? -1];
    if (mapped && ["steam", "epic", "gog", "official"].includes(mapped.key)) {
      byKey.set(mapped.key, { key: mapped.key, label: mapped.label, url: site.url });
    }
    const hinted = hostHint(site.url);
    if (hinted) byKey.set(hinted.key, hinted);
  }

  for (const ext of game.external_games || []) {
    if (!ext.url) continue;
    const mapped = EXTERNAL_CATEGORY[ext.category ?? -1];
    if (mapped) {
      byKey.set(mapped.key, { key: mapped.key, label: mapped.label, url: ext.url });
    }
    const hinted = hostHint(ext.url);
    if (hinted) byKey.set(hinted.key, hinted);
  }

  const preferred = [
    "steam",
    "ubisoft",
    "epic",
    "gog",
    "ea",
    "battlenet",
    "xbox",
    "playstation",
    "nintendo",
    "humble",
    "official",
  ];
  return preferred
    .map((key) => byKey.get(key))
    .filter((link): link is GameStoreLink => Boolean(link));
}

export function normalizeIgdbGame(game: IgdbGame) {
  const coverUrl = igdbImageUrl(game.cover?.image_id, "t_cover_big");
  const screenshots = (game.screenshots || [])
    .map((shot) => igdbImageUrl(shot.image_id, "t_screenshot_huge"))
    .filter((url): url is string => Boolean(url))
    .slice(0, 16);
  const videos = (game.videos || [])
    .map((video) => ({
      id: video.video_id || "",
      name: video.name || "Trailer",
      embedUrl: youtubeEmbedUrl(video.video_id),
      watchUrl: youtubeWatchUrl(video.video_id),
    }))
    .filter((video) => video.id)
    .slice(0, 6);
  const genres = (game.genres || [])
    .map((g) => g.name)
    .filter((name): name is string => Boolean(name));
  const platforms = (game.platforms || [])
    .map((p) => p.name)
    .filter((name): name is string => Boolean(name));
  const developers = (game.involved_companies || [])
    .filter((c) => c.developer)
    .map((c) => c.company?.name)
    .filter((name): name is string => Boolean(name));
  const publishers = (game.involved_companies || [])
    .filter((c) => c.publisher)
    .map((c) => c.company?.name)
    .filter((name): name is string => Boolean(name));
  const websites = (game.websites || [])
    .filter((w) => w.url)
    .map((w) => ({
      category: w.category ?? null,
      url: w.url!,
      label: WEBSITE_CATEGORY[w.category ?? -1]?.label || "Link",
    }));
  const storeLinks = buildStoreLinks(game);
  const releaseDate =
    typeof game.first_release_date === "number"
      ? new Date(game.first_release_date * 1000)
      : null;

  return {
    igdbId: game.id,
    name: game.name,
    slug: game.slug || String(game.id),
    summary: game.summary || null,
    storyline: game.storyline || null,
    coverUrl,
    releaseDate,
    igdbRating: typeof game.rating === "number" ? game.rating / 10 : null,
    igdbRatingCount: game.rating_count ?? null,
    genres,
    platforms,
    developers,
    publishers,
    screenshots,
    videos,
    websites,
    storeLinks,
    raw: game,
  };
}
