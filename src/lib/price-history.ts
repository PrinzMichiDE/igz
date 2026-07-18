import { prisma } from "@/lib/db/prisma";
import { numericPrice } from "@/lib/product-links";

export type PriceTrend = "down" | "up" | "stable" | "unknown";

export async function recordPriceSnapshot(
  productId: string,
  price: number | null,
  currency: string,
) {
  if (price === null) return;

  const latest = await prisma.productPriceSnapshot
    .findFirst({
      where: { productId },
      orderBy: { recordedAt: "desc" },
    })
    .catch(() => null);

  if (latest && Number(latest.price) === price) return;

  await prisma.productPriceSnapshot
    .create({
      data: { productId, price, currency },
    })
    .catch(() => null);

  const oldSnapshots = await prisma.productPriceSnapshot
    .findMany({
      where: { productId },
      orderBy: { recordedAt: "desc" },
      skip: 30,
      select: { id: true },
    })
    .catch(() => []);

  if (oldSnapshots.length > 0) {
    await prisma.productPriceSnapshot
      .deleteMany({
        where: { id: { in: oldSnapshots.map((s) => s.id) } },
      })
      .catch(() => null);
  }
}

export async function getPriceHistory(productId: string, limit = 14) {
  return prisma.productPriceSnapshot
    .findMany({
      where: { productId },
      orderBy: { recordedAt: "asc" },
      take: limit,
    })
    .catch(() => []);
}

export function computePriceTrend(
  history: Array<{ price: { toString(): string } }>,
): { trend: PriceTrend; changePercent: number | null } {
  if (history.length < 2) {
    return { trend: "unknown", changePercent: null };
  }

  const first = numericPrice(history[0]?.price);
  const last = numericPrice(history[history.length - 1]?.price);

  if (first === null || last === null || first === 0) {
    return { trend: "unknown", changePercent: null };
  }

  const changePercent = Math.round(((last - first) / first) * 100);

  if (changePercent <= -3) return { trend: "down", changePercent };
  if (changePercent >= 3) return { trend: "up", changePercent };
  return { trend: "stable", changePercent };
}
