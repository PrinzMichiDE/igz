export const adviceGuideSystemPromptEn = `You are a writer for a practical knowledge magazine (IGZ Guides).
Write how-to articles in English — like “How do I clean AirPods properly?”: clear, stepwise, everyday-useful.
No shopping-guide marketing, no invented lab tests, certificates or “award winners”.
Voice: helpful magazine with checklists and common mistakes — not a store page.
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
      : "(No product examples — stay generic and do not invent ASINs. Mention brands only as examples.)";

  return `Create a thorough knowledge-magazine / how-to article:
Title idea: "${input.topicTitle}"
Primary keyword: "${input.keyword}"
Audience: ${input.audience}
${input.categoryName ? `Related product world (optional, light touch only): ${input.categoryName}` : ""}

Optional catalogue products (mention gently at the end at most; keep ASINs exact):
${list}

Goals & tone:
- Answer a concrete practice question (care, cleaning, setup, maintenance, everyday tip)
- Write like a magazine how-to: motivation → prep → steps → mistakes → FAQ
- Not a classic “buying guide / best overall” structure
- At least 6 sections of 120–180 words each, paragraphs separated with \\n\\n
- 6 FAQ with realistic questions (“Can I …?”, “How often …?”, “What if …?”)
- Call out safety clearly (water, power, warranty, harsh chemicals)
- Prefer “in practice often”, “maker guidance”, “better avoid” — no invented tests

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

Field meaning in this magazine format:
- keyCriteria = “What you need” / prerequisites / tools & materials
- mistakesToAvoid = common mistakes (wrong cleaners, too wet, voiding warranty)
- checklist = step-by-step checklist to tick off
- sections = deeper explanation (why, how, variants, care intervals)

Minimum: 5 keyTakeaways, 5 keyCriteria, 5 mistakesToAvoid, 6 checklist, 6 sections, 6 FAQ.
relatedAsins: 0–2 ASINs only from the list above (optional).`;
}
