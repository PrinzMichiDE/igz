export const comparisonSystemPromptEn = `You are an editor for product comparison guides.
Write a clear, fair category comparison in English.
Do not invent lab tests. Reply with JSON only.`;

export function buildComparisonUserPromptEn(input: {
  categoryName: string;
  products: Array<{
    title: string;
    asin: string;
    price?: string | null;
    rating?: number | null;
    score?: number | null;
  }>;
}) {
  return `Compare these products in category "${input.categoryName}":

${input.products
  .map(
    (p, i) =>
      `${i + 1}. ${p.title} | ASIN ${p.asin} | price ${p.price ?? "?"} | rating ${p.rating ?? "?"} | score ${p.score ?? "?"}`,
  )
  .join("\n")}

JSON schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "winnerAsin": string,
  "priceWinnerAsin": string,
  "budgetWinnerAsin": string,
  "intro": string,
  "directAnswer": string,
  "keyTakeaways": string[],
  "rankingNotes": string[],
  "faq": [ { "question": string, "answer": string } ]
}`;
}
