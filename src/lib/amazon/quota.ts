import { prisma } from "@/lib/db/prisma";
import { currentYearMonth } from "@/lib/utils";

const PROVIDER = "rapidapi_amazon";

function limits() {
  return {
    softLimit: Number(process.env.RAPIDAPI_MONTHLY_LIMIT ?? 100),
    reserve: Number(process.env.RAPIDAPI_MONTHLY_RESERVE ?? 6),
  };
}

export async function getQuotaStatus() {
  const yearMonth = currentYearMonth();
  const { softLimit, reserve } = limits();

  const row = await prisma.apiQuotaMonth.upsert({
    where: {
      provider_yearMonth: { provider: PROVIDER, yearMonth },
    },
    create: {
      provider: PROVIDER,
      yearMonth,
      used: 0,
      softLimit,
      reserve,
    },
    update: {
      softLimit,
      reserve,
    },
  });

  const remaining = Math.max(0, row.softLimit - row.used);
  const available = Math.max(0, remaining - row.reserve);

  return {
    yearMonth: row.yearMonth,
    used: row.used,
    softLimit: row.softLimit,
    reserve: row.reserve,
    remaining,
    available,
    canSpend: (n: number) => available >= n,
  };
}

export class QuotaExceededError extends Error {
  constructor(message = "RapidAPI monthly quota exceeded or reserve reached") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export async function assertQuota(requestsNeeded = 1) {
  const status = await getQuotaStatus();
  if (!status.canSpend(requestsNeeded)) {
    throw new QuotaExceededError(
      `Need ${requestsNeeded} request(s), available=${status.available}, used=${status.used}/${status.softLimit}`,
    );
  }
  return status;
}

export async function incrementQuota(by = 1) {
  const yearMonth = currentYearMonth();
  const { softLimit, reserve } = limits();

  return prisma.apiQuotaMonth.upsert({
    where: {
      provider_yearMonth: { provider: PROVIDER, yearMonth },
    },
    create: {
      provider: PROVIDER,
      yearMonth,
      used: by,
      softLimit,
      reserve,
    },
    update: {
      used: { increment: by },
      softLimit,
      reserve,
    },
  });
}
