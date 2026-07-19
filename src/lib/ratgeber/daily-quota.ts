import { prisma } from "@/lib/db/prisma";
import { utcDayStart } from "@/lib/review-daily-quota";

/** New Ratgeber / advice guides to publish per UTC day. */
export const DAILY_NEW_ADVICE_GUIDE_TARGET = 1;

export async function countSucceededAdviceGuidesToday(now = new Date()) {
  return prisma.jobRun.count({
    where: {
      type: "generate_advice_guide",
      status: "succeeded",
      finishedAt: { gte: utcDayStart(now) },
    },
  });
}

export async function remainingDailyAdviceGuideSlots(options?: {
  now?: Date;
  target?: number;
  bypass?: boolean;
}) {
  if (options?.bypass) return DAILY_NEW_ADVICE_GUIDE_TARGET;
  const target = options?.target ?? DAILY_NEW_ADVICE_GUIDE_TARGET;
  const used = await countSucceededAdviceGuidesToday(options?.now);
  return Math.max(0, target - used);
}
