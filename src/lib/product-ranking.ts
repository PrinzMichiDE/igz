export type MatchPriority = "score" | "price" | "rating";

export type MatchCandidate = {
  id: string;
  slug: string;
  title: string;
  href: string;
  imageUrl?: string | null;
  price: number | null;
  currency: string;
  score: number | null;
  rating: number | null;
  bestFor: string[];
  notFor: string[];
  ctaHref: string;
};

export type MatchPreferences = {
  budgetMax: number;
  priority: MatchPriority;
  useCase: string;
};

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function useCaseScore(candidate: MatchCandidate, useCase: string) {
  if (!useCase.trim()) return 0;
  const needle = normalizeText(useCase);
  let score = 0;

  for (const item of candidate.bestFor) {
    if (normalizeText(item).includes(needle) || needle.includes(normalizeText(item))) {
      score += 2;
    }
  }

  for (const item of candidate.notFor) {
    if (normalizeText(item).includes(needle) || needle.includes(normalizeText(item))) {
      score -= 2;
    }
  }

  return score;
}

function priorityScore(candidate: MatchCandidate, priority: MatchPriority) {
  switch (priority) {
    case "score":
      return candidate.score ?? 0;
    case "rating":
      return candidate.rating ?? 0;
    case "price":
      return candidate.price === null ? 0 : 1000 / candidate.price;
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

export function rankProductsForMatch(
  candidates: MatchCandidate[],
  preferences: MatchPreferences,
) {
  return [...candidates]
    .filter(
      (candidate) =>
        candidate.price === null || candidate.price <= preferences.budgetMax,
    )
    .map((candidate) => {
      const fit = useCaseScore(candidate, preferences.useCase);
      const priority = priorityScore(candidate, preferences.priority);
      const total = fit * 10 + priority;

      return {
        candidate,
        fit,
        total,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function buildFeatureMatrix(
  products: Array<{ id: string; title: string; features: string[] }>,
) {
  const featureSet = new Set<string>();

  for (const product of products) {
    for (const feature of product.features) {
      featureSet.add(feature);
    }
  }

  const features = [...featureSet].sort((a, b) => a.localeCompare(b));

  return {
    features,
    rows: products.map((product) => ({
      id: product.id,
      title: product.title,
      values: features.map((feature) => product.features.includes(feature)),
    })),
  };
}
