export const buyingGuideSystemPromptEn = `You are an experienced buying advisor for an independent comparison platform.
Write practical, SEO-friendly buying guides in English — no invented lab tests or certifications.

Respond only as valid JSON.`;

export function buildBuyingGuideUserPromptEn(input: {
  categoryName: string;
  products: Array<{
    title: string;
    asin: string;
    price?: string | null;
    rating?: number | null;
    score?: number | null;
  }>;
}) {
  const list = input.products
    .map(
      (p, i) =>
        `${i + 1}. ${p.title} (ASIN ${p.asin}, price ${p.price ?? "?"}, rating ${p.rating ?? "?"}, score ${p.score ?? "?"})`,
    )
    .join("\n");

  return `Create a comprehensive buying guide for the category "${input.categoryName}".

Products in the comparison:
${list}

Goal: help readers understand what to look for, common mistakes to avoid, and which model fits each budget/scenario.

JSON schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "intro": string,
  "keyCriteria": string[],
  "budgetTiers": [
    { "label": string, "range": string, "recommendation": string, "asin": string }
  ],
  "mistakesToAvoid": string[],
  "checklist": string[],
  "sections": [ { "heading": string, "body": string } ],
  "faq": [ { "question": string, "answer": string } ]
}

At least 5 sections with 100+ words each, 6 FAQ items, 5 keyCriteria, 3 budgetTiers.`;
}
