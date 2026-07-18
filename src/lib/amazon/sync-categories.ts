import { prisma } from "@/lib/db/prisma";
import { listProductCategories } from "@/lib/amazon/rapidapi";
import {
  AMAZON_TOP_CATEGORIES_DE,
  isDeniedAmazonCategoryId,
  normalizeAmazonCategoryName,
  type TopCategorySeed,
} from "@/lib/amazon/top-categories";
import { slugify } from "@/lib/utils";

const TARGET_COUNT = 50;

function buildFromApiCategory(item: { id?: string; name?: string }): TopCategorySeed | null {
  if (!item.id || !item.name || isDeniedAmazonCategoryId(item.id)) {
    return null;
  }

  const slug = slugify(item.name);
  if (!slug || slug.length < 2) return null;

  return {
    slug,
    amazonCategoryId: item.id,
    nameDe: item.name,
    nameEn: item.name,
    descriptionDe: `Vergleich aktueller Amazon-Bestseller in der Kategorie ${item.name}.`,
    descriptionEn: `Compare current Amazon bestsellers in the ${item.name} category.`,
    searchKeywords: [item.name, "bestseller"],
  };
}

async function upsertCategory(seed: TopCategorySeed) {
  return prisma.category.upsert({
    where: { slug: seed.slug },
    create: {
      slug: seed.slug,
      amazonCategoryId: seed.amazonCategoryId,
      nameDe: seed.nameDe,
      nameEn: seed.nameEn,
      descriptionDe: seed.descriptionDe,
      descriptionEn: seed.descriptionEn,
      searchKeywords: seed.searchKeywords,
      countryScope: "DE",
    },
    update: {
      amazonCategoryId: seed.amazonCategoryId,
      nameDe: seed.nameDe,
      nameEn: seed.nameEn,
      descriptionDe: seed.descriptionDe,
      descriptionEn: seed.descriptionEn,
      searchKeywords: seed.searchKeywords,
      countryScope: "DE",
    },
  });
}

/**
 * Ensures the Top 50 Amazon-oriented categories exist in Postgres.
 * 1) Upserts curated affiliate niches (always, no API quota).
 * 2) Optionally pulls live `/product-category-list` and fills gaps up to 50.
 */
export async function ensureTopAmazonCategories(options?: {
  country?: string;
  limit?: number;
  fetchFromApi?: boolean;
}) {
  const country = options?.country || "DE";
  const limit = options?.limit ?? TARGET_COUNT;
  const fetchFromApi = options?.fetchFromApi !== false;

  let upserted = 0;
  const curated = AMAZON_TOP_CATEGORIES_DE.slice(0, limit);

  for (const seed of curated) {
    await upsertCategory(seed);
    upserted += 1;
  }

  let apiFetched = 0;
  let apiUpserted = 0;
  let apiError: string | null = null;

  if (fetchFromApi && process.env.RAPIDAPI_KEY) {
    try {
      const apiCategories = await listProductCategories(country);
      apiFetched = apiCategories.length;

      const existing = await prisma.category.findMany({
        select: { slug: true, amazonCategoryId: true, nameDe: true },
      });
      const existingSlugs = new Set(existing.map((c) => c.slug));
      const existingIds = new Set(
        existing
          .map((c) => c.amazonCategoryId)
          .filter((id): id is string => Boolean(id)),
      );
      const existingNames = new Set(
        existing.map((c) => normalizeAmazonCategoryName(c.nameDe)),
      );

      // Attach amazonCategoryId onto curated rows when names match API closely.
      for (const apiItem of apiCategories) {
        if (!apiItem.id || !apiItem.name || isDeniedAmazonCategoryId(apiItem.id)) {
          continue;
        }
        const normalized = normalizeAmazonCategoryName(apiItem.name);
        const match = existing.find(
          (c) =>
            normalizeAmazonCategoryName(c.nameDe) === normalized ||
            c.amazonCategoryId === apiItem.id,
        );
        if (match && match.amazonCategoryId !== apiItem.id) {
          await prisma.category.update({
            where: { slug: match.slug },
            data: { amazonCategoryId: apiItem.id },
          });
        }
      }

      let currentCount = await prisma.category.count();
      for (const apiItem of apiCategories) {
        if (currentCount >= limit) break;
        const seed = buildFromApiCategory(apiItem);
        if (!seed) continue;
        if (existingSlugs.has(seed.slug)) continue;
        if (existingIds.has(seed.amazonCategoryId)) continue;
        if (existingNames.has(normalizeAmazonCategoryName(seed.nameDe))) {
          continue;
        }

        await upsertCategory(seed);
        existingSlugs.add(seed.slug);
        existingIds.add(seed.amazonCategoryId);
        existingNames.add(normalizeAmazonCategoryName(seed.nameDe));
        apiUpserted += 1;
        upserted += 1;
        currentCount += 1;
      }
    } catch (error) {
      apiError = error instanceof Error ? error.message : "Unknown API error";
    }
  }

  const total = await prisma.category.count();
  return {
    ok: true,
    target: limit,
    curatedUpserted: curated.length,
    apiFetched,
    apiUpserted,
    upserted,
    total,
    apiError,
  };
}
