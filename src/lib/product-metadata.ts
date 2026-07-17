import type { AmazonSearchProduct } from "@/lib/amazon/rapidapi";
import { parsePrice } from "@/lib/amazon/rapidapi";

export type ProductTrustSignals = {
  isBestSeller: boolean;
  isAmazonChoice: boolean;
  salesVolume?: string;
  originalPrice: number | null;
  savingsPercent: number | null;
};

export function asAmazonSearchProduct(value: unknown): AmazonSearchProduct | null {
  if (!value || typeof value !== "object") return null;
  return value as AmazonSearchProduct;
}

export function extractTrustSignals(
  rawSearchJson: unknown,
  price: number | string | null | undefined,
): ProductTrustSignals {
  const raw = asAmazonSearchProduct(rawSearchJson);
  const currentPrice =
    typeof price === "string" ? parsePrice(price) : typeof price === "number" ? price : null;
  const originalPrice = parsePrice(raw?.product_original_price ?? null);
  let savingsPercent: number | null = null;

  if (
    currentPrice !== null &&
    originalPrice !== null &&
    originalPrice > currentPrice
  ) {
    savingsPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  return {
    isBestSeller: Boolean(raw?.is_best_seller),
    isAmazonChoice: Boolean(raw?.is_amazon_choice),
    salesVolume: raw?.sales_volume,
    originalPrice,
    savingsPercent,
  };
}

export function collectFeatureList(features: unknown): string[] {
  if (!Array.isArray(features)) return [];
  return features.filter((item): item is string => typeof item === "string");
}

export function averageNumeric(values: Array<number | null | undefined>): number | null {
  const valid = values.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function priceDeltaPercent(
  price: number | null,
  average: number | null,
): number | null {
  if (price === null || average === null || average === 0) return null;
  return Math.round(((price - average) / average) * 100);
}
