export type ScoreBreakdown = {
  overall?: number;
  value?: number;
  quality?: number;
  usability?: number;
  longevity?: number;
};

export type DecisionGuide = {
  buyIf?: string[];
  skipIf?: string[];
};

export type ReviewContent = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  score?: number;
  testingPeriod?: string;
  directAnswer?: string;
  keyTakeaways?: string[];
  scoreBreakdown?: ScoreBreakdown;
  decisionGuide?: DecisionGuide;
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
  directAnswer?: string;
  keyTakeaways?: string[];
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

export type AdviceGuideContent = {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  directAnswer?: string;
  keyTakeaways?: string[];
  intro?: string;
  keyCriteria?: string[];
  mistakesToAvoid?: string[];
  checklist?: string[];
  sections?: Array<{ heading: string; body: string }>;
  faq?: Array<{ question: string; answer: string }>;
  relatedAsins?: string[];
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

export function asAdviceGuideContent(value: unknown): AdviceGuideContent {
  if (!value || typeof value !== "object") return {};
  return value as AdviceGuideContent;
}
