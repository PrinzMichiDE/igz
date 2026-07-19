import { prisma } from "@/lib/db/prisma";

/** New Amazon product reviews to publish per UTC day (diversified). */
export const DAILY_NEW_REVIEW_TARGET = 3;

export function utcDayStart(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Count successful review generations finished today (UTC).
 * Used as a hard daily budget for automated backfill.
 */
export async function countSucceededReviewsToday(now = new Date()) {
  return prisma.jobRun.count({
    where: {
      type: "generate_review",
      status: "succeeded",
      finishedAt: { gte: utcDayStart(now) },
    },
  });
}

export async function remainingDailyReviewSlots(options?: {
  now?: Date;
  target?: number;
  /** Manual/forced single-product runs ignore the budget. */
  bypass?: boolean;
}) {
  if (options?.bypass) return DAILY_NEW_REVIEW_TARGET;
  const target = options?.target ?? DAILY_NEW_REVIEW_TARGET;
  const used = await countSucceededReviewsToday(options?.now);
  return Math.max(0, target - used);
}
