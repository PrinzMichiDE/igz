import { prisma } from "@/lib/db/prisma";

export async function resolveCronCategory(slug: string | null) {
  if (slug) {
    return prisma.category.findUnique({ where: { slug } });
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (categories.length === 0) {
    return null;
  }

  const dayIndex =
    Math.floor(Date.now() / 86_400_000) % categories.length;

  return categories[dayIndex] ?? categories[0];
}
