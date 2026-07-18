import { prisma } from "@/lib/db/prisma";

export async function resolveCronCategory(slug: string | null) {
  if (slug) {
    return prisma.category.findUnique({ where: { slug } });
  }

  // Prefer categories that still need products, then rotate daily.
  const underfilled = await prisma.category.findMany({
    where: { products: { none: {} } },
    orderBy: { createdAt: "asc" },
    take: 1,
  });
  if (underfilled[0]) {
    return underfilled[0];
  }

  const lowStock = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (lowStock.length === 0) {
    return null;
  }

  const sparsest = [...lowStock].sort(
    (a, b) => a._count.products - b._count.products,
  );
  const sparsePool = sparsest.filter(
    (category) => category._count.products < 8,
  );
  const pool = sparsePool.length > 0 ? sparsePool : sparsest;

  const dayIndex = Math.floor(Date.now() / 86_400_000) % pool.length;
  return pool[dayIndex] ?? pool[0];
}
