import { buildAffiliateOutUrl } from "@/lib/affiliate-out";

type ProductLinkInput = {
  asin: string;
  affiliateUrl?: string | null;
  productUrl?: string | null;
};

export function productOutHref(
  product: ProductLinkInput,
  locale: string,
  path: string,
) {
  const target = product.affiliateUrl || product.productUrl || "#";
  return buildAffiliateOutUrl({
    targetUrl: target,
    asin: product.asin,
    locale,
    path,
  });
}

export function numericPrice(
  price: { toString(): string } | number | string | null | undefined,
): number | null {
  if (price === null || price === undefined) return null;
  const value = typeof price === "number" ? price : Number(price.toString());
  return Number.isFinite(value) ? value : null;
}
