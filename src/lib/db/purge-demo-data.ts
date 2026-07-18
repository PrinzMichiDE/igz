import { prisma } from "@/lib/db/prisma";

const DEMO_ASINS = [
  "B0DEMO0001",
  "B0DEMO0002",
  "B0DEMO0003",
  "B0DEMO0004",
  "B0DEMO0005",
] as const;

/**
 * Removes seeded demo products and related demo content from Postgres.
 * Safe to run repeatedly (idempotent).
 */
export async function purgeDemoData() {
  const demoProducts = await prisma.product.findMany({
    where: {
      OR: [
        { asin: { in: [...DEMO_ASINS] } },
        { asin: { startsWith: "B0DEMO" } },
        { slug: { startsWith: "demo-" } },
        { title: { startsWith: "Demo " } },
        { title: { contains: "Demo Kopfhörer" } },
        { title: { contains: "Demo Akkusauger" } },
        { title: { contains: "Demo Sport" } },
      ],
    },
    select: { id: true, asin: true, slug: true, title: true },
  });

  const productIds = demoProducts.map((p) => p.id);

  const deletedComments = await prisma.productExperienceComment.deleteMany({
    where: {
      OR: [
        { source: "seed_demo" },
        ...(productIds.length > 0 ? [{ productId: { in: productIds } }] : []),
      ],
    },
  });

  const deletedArticles = await prisma.article.deleteMany({
    where: {
      OR: [
        ...(productIds.length > 0 ? [{ productId: { in: productIds } }] : []),
        { title: { contains: "(Demo)" } },
        { slug: { contains: "demo" } },
        { excerpt: { contains: "Demo-Inhalt" } },
        { excerpt: { contains: "Demo content" } },
      ],
    },
  });

  const deletedComparisons =
    productIds.length > 0
      ? await prisma.comparison.deleteMany({
          where: {
            OR: [
              { winnerProductId: { in: productIds } },
              { priceWinnerId: { in: productIds } },
              { budgetWinnerId: { in: productIds } },
            ],
          },
        })
      : { count: 0 };

  const deletedProducts =
    productIds.length > 0
      ? await prisma.product.deleteMany({
          where: { id: { in: productIds } },
        })
      : { count: 0 };

  // Also drop leftover demo comparisons that only had demo criteria text.
  const leftoverDemoComparisons = await prisma.comparison.findMany({
    select: { id: true, criteriaJson: true },
  });
  const demoComparisonIds = leftoverDemoComparisons
    .filter((row) => {
      const intro =
        row.criteriaJson &&
        typeof row.criteriaJson === "object" &&
        "intro" in row.criteriaJson
          ? String((row.criteriaJson as { intro?: unknown }).intro || "")
          : "";
      return intro.includes("Demo-Vergleich");
    })
    .map((row) => row.id);

  let deletedDemoCriteriaComparisons = 0;
  if (demoComparisonIds.length > 0) {
    const result = await prisma.comparison.deleteMany({
      where: { id: { in: demoComparisonIds } },
    });
    deletedDemoCriteriaComparisons = result.count;
  }

  return {
    products: deletedProducts.count,
    articles: deletedArticles.count,
    comments: deletedComments.count,
    comparisons: deletedComparisons.count + deletedDemoCriteriaComparisons,
    removed: demoProducts.map((p) => ({
      asin: p.asin,
      slug: p.slug,
      title: p.title,
    })),
  };
}
