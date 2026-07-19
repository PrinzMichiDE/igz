/**
 * Entertainment media niches that get a dedicated daily review pipeline.
 */
export const ENTERTAINMENT_CATEGORY_SLUGS = [
  "filme",
  "serien",
  "videospiele",
] as const;

export type EntertainmentCategorySlug =
  (typeof ENTERTAINMENT_CATEGORY_SLUGS)[number];

export function isEntertainmentCategorySlug(
  slug?: string | null,
): slug is EntertainmentCategorySlug {
  if (!slug) return false;
  return (ENTERTAINMENT_CATEGORY_SLUGS as readonly string[]).includes(slug);
}

/** Rotate which entertainment category gets a fresh Amazon search sync today. */
export function entertainmentSyncSlugForToday(
  now = new Date(),
): EntertainmentCategorySlug {
  const day = Math.floor(now.getTime() / 86_400_000);
  return ENTERTAINMENT_CATEGORY_SLUGS[
    day % ENTERTAINMENT_CATEGORY_SLUGS.length
  ]!;
}

export function entertainmentDailyReviewTarget(now = new Date()) {
  // 10–20 reviews/day for the entertainment group.
  // Slight weekday boost, weekend slightly lower OpenRouter load.
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  if (day === 0 || day === 6) return 12;
  return 16;
}
