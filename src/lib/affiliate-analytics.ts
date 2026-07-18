import { prisma } from "@/lib/db/prisma";

export async function getAffiliateAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);

  const [total, byAsin, byPath, byLocale] = await Promise.all([
    prisma.affiliateClick.count({ where: { createdAt: { gte: since } } }).catch(() => 0),
    prisma.affiliateClick
      .groupBy({
        by: ["asin"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { asin: "desc" } },
        take: 10,
      })
      .catch(() => []),
    prisma.affiliateClick
      .groupBy({
        by: ["path"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 10,
      })
      .catch(() => []),
    prisma.affiliateClick
      .groupBy({
        by: ["locale"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      })
      .catch(() => []),
  ]);

  const products =
    byAsin.length > 0
      ? await prisma.product.findMany({
          where: { asin: { in: byAsin.map((row) => row.asin) } },
          select: { asin: true, title: true, slug: true },
        })
      : [];

  const titleByAsin = new Map(products.map((p) => [p.asin, p]));

  return {
    days,
    totalClicks: total,
    topProducts: byAsin.map((row) => ({
      asin: row.asin,
      title: titleByAsin.get(row.asin)?.title ?? row.asin,
      slug: titleByAsin.get(row.asin)?.slug,
      clicks: row._count._all,
    })),
    topPaths: byPath.map((row) => ({
      path: row.path ?? "/",
      clicks: row._count._all,
    })),
    byLocale: byLocale.map((row) => ({
      locale: row.locale,
      clicks: row._count._all,
    })),
  };
}
