import { scoreOrZero } from "@/lib/compare/pair";

export type ComparableProduct = {
  id: string;
  slug: string;
  title: string;
  asin: string;
  imageUrl?: string | null;
  price?: { toString(): string } | number | string | null;
  currency: string;
  rating?: number | null;
  reviewCount: number;
  editorialScore?: number | null;
  features?: unknown;
  affiliateUrl?: string | null;
  productUrl?: string | null;
};

export type HeadToHeadRow = {
  label: string;
  key: string;
  a: string;
  b: string;
  winner: "a" | "b" | "tie";
};

function asNumberPrice(price: ComparableProduct["price"]) {
  if (price === null || price === undefined) return null;
  const n = Number(price.toString());
  return Number.isFinite(n) ? n : null;
}

export function buildHeadToHeadRows(
  a: ComparableProduct,
  b: ComparableProduct,
  labels: {
    score: string;
    price: string;
    rating: string;
    reviews: string;
  },
): HeadToHeadRow[] {
  const scoreA = scoreOrZero(a.editorialScore ?? a.rating);
  const scoreB = scoreOrZero(b.editorialScore ?? b.rating);
  const priceA = asNumberPrice(a.price);
  const priceB = asNumberPrice(b.price);
  const ratingA = scoreOrZero(a.rating);
  const ratingB = scoreOrZero(b.rating);

  return [
    {
      key: "score",
      label: labels.score,
      a: scoreA ? scoreA.toFixed(1) : "—",
      b: scoreB ? scoreB.toFixed(1) : "—",
      winner:
        scoreA === scoreB ? "tie" : scoreA > scoreB ? "a" : "b",
    },
    {
      key: "price",
      label: labels.price,
      a: priceA !== null ? String(priceA) : "—",
      b: priceB !== null ? String(priceB) : "—",
      winner:
        priceA === null || priceB === null
          ? "tie"
          : priceA === priceB
            ? "tie"
            : priceA < priceB
              ? "a"
              : "b",
    },
    {
      key: "rating",
      label: labels.rating,
      a: ratingA ? ratingA.toFixed(1) : "—",
      b: ratingB ? ratingB.toFixed(1) : "—",
      winner:
        ratingA === ratingB ? "tie" : ratingA > ratingB ? "a" : "b",
    },
    {
      key: "reviews",
      label: labels.reviews,
      a: String(a.reviewCount ?? 0),
      b: String(b.reviewCount ?? 0),
      winner:
        a.reviewCount === b.reviewCount
          ? "tie"
          : a.reviewCount > b.reviewCount
            ? "a"
            : "b",
    },
  ];
}

export function decideOverallWinner(
  a: ComparableProduct,
  b: ComparableProduct,
) {
  const scoreA = scoreOrZero(a.editorialScore ?? a.rating);
  const scoreB = scoreOrZero(b.editorialScore ?? b.rating);
  if (scoreA === scoreB) return "tie" as const;
  return scoreA > scoreB ? ("a" as const) : ("b" as const);
}

export function featureList(product: ComparableProduct) {
  return Array.isArray(product.features)
    ? (product.features as string[]).slice(0, 8)
    : [];
}
