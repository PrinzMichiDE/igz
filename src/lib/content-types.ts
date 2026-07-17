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

export function asReviewContent(value: unknown): ReviewContent {
  if (!value || typeof value !== "object") return {};
  return value as ReviewContent;
}

export function asComparisonContent(value: unknown): ComparisonContent {
  if (!value || typeof value !== "object") return {};
  return value as ComparisonContent;
}
