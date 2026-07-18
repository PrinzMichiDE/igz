import { prisma } from "@/lib/db/prisma";
import {
  averageNumeric,
  extractTrustSignals,
  priceDeltaPercent,
} from "@/lib/product-metadata";
import { numericPrice } from "@/lib/product-links";

export type DealItem = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  price: number | null;
  currency: string;
  score: number | null;
  categorySlug: string;
  categoryName: string;
  savingsPercent: number;
  belowAveragePercent: number | null;
  isBestSeller: boolean;
  isAmazonChoice: boolean;
};

export async function getTopDeals(locale: "de" | "en", limit = 24) {
  const products = await prisma.product
    .findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    })
    .catch(() => []);

  const categoryAverages = new Map<string, number>();
  for (const product of products) {
    const categoryId = product.categoryId;
    if (!categoryAverages.has(categoryId)) {
      const prices = products
        .filter((item) => item.categoryId === categoryId)
        .map((item) => numericPrice(item.price));
      categoryAverages.set(categoryId, averageNumeric(prices) ?? 0);
    }
  }

  const deals: Array<DealItem & { dealScore: number }> = [];

  for (const product of products) {
    const price = numericPrice(product.price);
    const signals = extractTrustSignals(
      product.rawSearchJson,
      product.price?.toString(),
    );
    const categoryAvg = categoryAverages.get(product.categoryId) ?? null;
    const belowAverage = priceDeltaPercent(price, categoryAvg);
    const savingsPercent = signals.savingsPercent ?? 0;
    const dealScore =
      savingsPercent +
      (belowAverage !== null && belowAverage < 0 ? Math.abs(belowAverage) : 0) +
      (signals.isBestSeller ? 5 : 0) +
      (signals.isAmazonChoice ? 3 : 0);

    if (savingsPercent <= 0 && (belowAverage === null || belowAverage >= 0)) {
      continue;
    }

    deals.push({
      id: product.id,
      slug: product.slug,
      title: product.title,
      imageUrl: product.imageUrl,
      price,
      currency: product.currency,
      score: product.editorialScore ?? product.rating,
      categorySlug: product.category.slug,
      categoryName:
        locale === "en" ? product.category.nameEn : product.category.nameDe,
      savingsPercent: Math.max(savingsPercent, 0),
      belowAveragePercent: belowAverage !== null && belowAverage < 0 ? Math.abs(belowAverage) : null,
      isBestSeller: signals.isBestSeller,
      isAmazonChoice: signals.isAmazonChoice,
      dealScore,
    });
  }

  return deals
    .sort((a, b) => b.dealScore - a.dealScore)
    .slice(0, limit)
    .map(
      ({
        dealScore,
        ...deal
      }): DealItem => deal,
    );
}
