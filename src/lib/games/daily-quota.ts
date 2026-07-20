import { prisma } from "@/lib/db/prisma";

export const DAILY_NEW_GAME_REVIEW_TARGET = 10;

function startOfUtcDay(date = new Date()) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export async function countSucceededGameReviewsToday() {
  const since = startOfUtcDay();
  return prisma.jobRun.count({
    where: {
      type: "generate_game_review",
      status: "succeeded",
      createdAt: { gte: since },
    },
  });
}

export async function remainingDailyGameReviewSlots(options?: {
  bypass?: boolean;
  target?: number;
}) {
  if (options?.bypass) return options.target ?? DAILY_NEW_GAME_REVIEW_TARGET;
  const target = options?.target ?? DAILY_NEW_GAME_REVIEW_TARGET;
  const used = await countSucceededGameReviewsToday();
  return Math.max(0, target - used);
}
