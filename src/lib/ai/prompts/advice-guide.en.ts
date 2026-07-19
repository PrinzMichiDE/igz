export const adviceGuideSystemPromptEn = `You are a senior editor for an independent comparison site (IGZ).
Write practical buying guides in English — clear, concrete, no marketing fluff and no invented lab tests, certificates or “test wins”.
Voice: an editorial advisor protecting readers from bad purchases.
Respond only as a valid JSON object. First character must be {, last must be }.`;

export function buildAdviceGuideUserPromptEn(input: {
  topicTitle: string;
  keyword: string;
  audience: string;
  categoryName?: string | null;
  products: Array<{
    title: string;
    asin: string;
    price?: string | null;
    rating?: number | null;
    score?: number | null;
  }>;
}) {
  const list =
    input.products.length > 0
      ? input.products
          .map(
            (p, i) =>
              `${i + 1}. ${p.title} (ASIN ${p.asin}, price ${p.price ?? "?"}, rating ${p.rating ?? "?"}, score ${p.score ?? "?"})`,
          )
          .join("\n")
      : "(No product examples on file — stay generic and do not invent ASINs.)";

  return `Create a thorough guide for this topic:
Title idea: "${input.topicTitle}"
Primary keyword: "${input.keyword}"
Audience: ${input.audience}
${input.categoryName ? `Related category: ${input.categoryName}` : ""}

Optional product examples from our catalogue (use only if relevant; keep ASINs exact):
${list}

Goals:
- Direct answer to the core search intent
- Buying criteria, mistakes to avoid, checklist
- At least 6 sections of 120–180 words each, paragraphs separated with \\n\\n
- 6 FAQ with realistic reader questions
- No invented test results; prefer “according to the maker”, “common in user reports”, “in practice often”

JSON schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "directAnswer": string,
  "keyTakeaways": string[],
  "intro": string,
  "keyCriteria": string[],
  "mistakesToAvoid": string[],
  "checklist": string[],
  "sections": [ { "heading": string, "body": string } ],
  "faq": [ { "question": string, "answer": string } ],
  "relatedAsins": string[]
}

Minimum: 5 keyTakeaways, 5 keyCriteria, 5 mistakesToAvoid, 6 checklist, 6 sections, 6 FAQ.
relatedAsins: 0–3 ASINs only from the product list above.`;
}
