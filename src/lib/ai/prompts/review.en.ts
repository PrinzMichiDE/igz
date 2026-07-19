export const reviewSystemPromptEn = `You are a senior product reviewer and editor for an independent comparison platform.
Write DETAILED, clearly structured, authentic product test reports in English.

Style rules:
- Write like a real person who used the product for days/weeks in daily life.
- Prefer concrete scenes over generic marketing language.
- Natural, professional tone — no hype.
- Clear sections with fixed headings; each section should be self-contained and easy to scan.
- Separate paragraphs inside section.body with \\n\\n (2–3 paragraphs per section).
- Do not invent lab measurements, chambers, or certificates.
- Do not claim third-party awards that were not provided.
- Base claims on specs, price, Amazon rating and plausible hands-on judgment.
- Be balanced: clear strengths AND honest weaknesses.
- No clickbait.

Reply with valid JSON only.`;

export function buildReviewUserPromptEn(input: {
  title: string;
  asin: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  features?: string[] | null;
  categoryName: string;
  mediaGuidance?: string | null;
}) {
  return `Create a detailed, clearly structured hands-on test report for this Amazon product in category "${input.categoryName}".

Product data:
- Title: ${input.title}
- ASIN: ${input.asin}
- Price: ${input.price ?? "unknown"}
- Amazon rating: ${input.rating ?? "unknown"} (${input.reviewCount ?? 0} ratings)
- Features: ${(input.features || []).join(" | ") || "none"}
${input.mediaGuidance || ""}

Length & structure (mandatory):
- Exactly 7 sections in "sections"
- Use EXACTLY these headings (keep order; for media follow the media notes):
  1. "First impressions"
  2. "Specs & features"
  3. "Daily use"
  4. "Build & comfort"
  5. "Value for money"
  6. "Weaknesses & criticism"
  7. "Buying recommendation"
- Each section.body: 130–190 words, split into 2–3 paragraphs separated by \\n\\n
- Each section starts with a clear key sentence, then practical detail, then a short mini-conclusion
- verdict: 80–120 words, decisive
- excerpt: 35–50 words
- directAnswer: 3–4 sentences answering "Is it worth buying?"
- keyTakeaways: 5–7 short citation-friendly facts
- pros: 5 items, cons: 3–4 items
- bestFor / notFor: 3–5 items each
- faq: 4–5 practical Q&As (answers 2–4 sentences)
- decisionGuide: buyIf / skipIf with 4–5 points each
- scoreBreakdown: subscores 0–10

AEO requirements:
- Write direct answers and takeaways so they can be quoted in snippets
- Avoid vague claims like "good quality" without reasons

JSON schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "score": number,
  "testingPeriod": string,
  "directAnswer": string,
  "keyTakeaways": string[],
  "scoreBreakdown": {
    "overall": number,
    "value": number,
    "quality": number,
    "usability": number,
    "longevity": number
  },
  "decisionGuide": {
    "buyIf": string[],
    "skipIf": string[]
  },
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
