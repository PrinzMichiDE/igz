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

export function entertainmentDailyReviewTarget(_now = new Date()) {
  // Entertainment reviews share the global daily budget (3 tests/day).
  // Dedicated entertainment cron is sync-only unless ?reviews=1 is passed.
  return 0;
}
