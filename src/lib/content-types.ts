export type ReviewContent = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  score?: number;
  testingPeriod?: string;
  pros?: string[];
  cons?: string[];
  bestFor?: string[];
  notFor?: string[];
  verdict?: string;
  sections?: Array<{ heading: string; body: string }>;
  faq?: Array<{ question: string; answer: string }>;
};

export type ComparisonContent = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  winnerAsin?: string;
  priceWinnerAsin?: string;
  budgetWinnerAsin?: string;
  intro?: string;
  rankingNotes?: string[];
  faq?: Array<{ question: string; answer: string }>;
};

export type BuyingGuideContent = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  intro?: string;
  keyCriteria?: string[];
  budgetTiers?: Array<{
    label: string;
    range: string;
    recommendation: string;
    asin: string;
  }>;
  mistakesToAvoid?: string[];
  checklist?: string[];
  sections?: Array<{ heading: string; body: string }>;
  faq?: Array<{ question: string; answer: string }>;
};

export function asReviewContent(value: unknown): ReviewContent {
  if (!value || typeof value !== "object") return {};
  return value as ReviewContent;
}

export function asComparisonContent(value: unknown): ComparisonContent {
  if (!value || typeof value !== "object") return {};
  return value as ComparisonContent;
}

export function asBuyingGuideContent(value: unknown): BuyingGuideContent {
  if (!value || typeof value !== "object") return {};
  return value as BuyingGuideContent;
}
