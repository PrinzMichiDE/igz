export const reviewSystemPromptEn = `You are an experienced product reviewer for an independent comparison platform.
Write authentic, helpful product reviews in English.
Do not invent lab measurements. Base claims on specs, price, user feedback and reasonable editorial judgment.
Keep a clear editorial tone. Reply with valid JSON only.`;

export function buildReviewUserPromptEn(input: {
  title: string;
  asin: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  features?: string[] | null;
  categoryName: string;
}) {
  return `Create a product review for this Amazon product in category "${input.categoryName}".

Product data:
- Title: ${input.title}
- ASIN: ${input.asin}
- Price: ${input.price ?? "unknown"}
- Amazon rating: ${input.rating ?? "unknown"} (${input.reviewCount ?? 0} ratings)
- Features: ${(input.features || []).join(" | ") || "none"}

JSON schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "score": number,
  "pros": string[],
  "cons": string[],
  "bestFor": string[],
  "notFor": string[],
  "verdict": string,
  "sections": [
    { "heading": string, "body": string }
  ],
  "faq": [ { "question": string, "answer": string } ]
}`;
}
