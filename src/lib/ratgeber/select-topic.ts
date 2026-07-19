import { prisma } from "@/lib/db/prisma";
import {
  listAdviceGuideTopics,
  type AdviceGuideTopic,
} from "@/lib/ratgeber/topics";
import type { Locale } from "@prisma/client";

/**
 * Pick the next unused Ratgeber topic for a locale.
 * Prefers high-priority topics whose category was not used in the recent
 * published guides (simple diversification across niches).
 */
export async function pickNextAdviceGuideTopic(
  locale: Locale,
): Promise<AdviceGuideTopic | null> {
  const pool = listAdviceGuideTopics();
  if (pool.length === 0) return null;

  const used = await prisma.article.findMany({
    where: {
      type: "advice_guide",
      locale,
      topicKey: { not: null },
    },
    select: { topicKey: true, categoryId: true, publishedAt: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const usedKeys = new Set(
    used.map((row) => row.topicKey).filter((key): key is string => Boolean(key)),
  );

  const unused = pool.filter((topic) => !usedKeys.has(topic.topicKey));
  if (unused.length === 0) return null;

  const recentCategoryIds = used
    .slice(0, 8)
    .map((row) => row.categoryId)
    .filter((id): id is string => Boolean(id));

  if (recentCategoryIds.length === 0) {
    return unused[0] ?? null;
  }

  const recentCategories = await prisma.category.findMany({
    where: { id: { in: recentCategoryIds } },
    select: { id: true, slug: true },
  });
  const recentSlugs = new Set(recentCategories.map((c) => c.slug));

  const diversified = unused.find(
    (topic) => !topic.categorySlug || !recentSlugs.has(topic.categorySlug),
  );
  return diversified ?? unused[0] ?? null;
}

export async function countPublishedAdviceGuides(locale?: Locale) {
  return prisma.article.count({
    where: {
      type: "advice_guide",
      status: "published",
      ...(locale ? { locale } : {}),
    },
  });
}

export async function countRemainingAdviceGuideTopics(locale: Locale) {
  const pool = listAdviceGuideTopics();
  const used = await prisma.article.findMany({
    where: {
      type: "advice_guide",
      locale,
      topicKey: { not: null },
    },
    select: { topicKey: true },
  });
  const usedKeys = new Set(
    used.map((row) => row.topicKey).filter((key): key is string => Boolean(key)),
  );
  return pool.filter((topic) => !usedKeys.has(topic.topicKey)).length;
}
