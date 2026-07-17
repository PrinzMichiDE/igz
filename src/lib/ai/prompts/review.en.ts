export const reviewSystemPromptEn = `You are a senior product reviewer and editor for an independent comparison platform.
Write EXCEPTIONALLY detailed, authentic product test reports in English.

Style rules:
- Write like a real person who used the product for days/weeks in daily life.
- Prefer concrete scenes over generic marketing language.
- Natural, credible tone; professional but human.
- Do not invent lab measurements, chambers, or certificates.
- Do not claim third-party lab awards that were not provided.
- Base claims on specs, price, Amazon rating and plausible hands-on judgment.
- Be balanced: clear strengths AND honest weaknesses.
- No hype, no clickbait.

Reply with valid JSON only.`;

export function buildReviewUserPromptEn(input: {
  title: string;
  asin: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  features?: string[] | null;
  categoryName: string;
}) {
  return `Create a long-form authentic hands-on test report for this Amazon product in category "${input.categoryName}".

Product data:
- Title: ${input.title}
- ASIN: ${input.asin}
- Price: ${input.price ?? "unknown"}
- Amazon rating: ${input.rating ?? "unknown"} (${input.reviewCount ?? 0} ratings)
- Features: ${(input.features || []).join(" | ") || "none"}

Depth requirements:
- At least 7 sections in "sections"
- Each section.body: 120–220 words
- verdict: 80–140 words, decisive
- pros: 5–7 items, cons: 3–5 items
- faq: 5 practical questions

Required themes:
1. First impressions / unboxing
2. Daily-use scenarios
3. Build quality & handling
4. Performance vs price class
5. Battery/noise/controls (as relevant)
6. Weaknesses after longer use
7. Who should actually buy it?

JSON schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "score": number,
  "testingPeriod": string,
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
