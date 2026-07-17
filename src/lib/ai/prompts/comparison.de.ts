export const comparisonSystemPromptDe = `Du bist Redakteur für Produktvergleiche.
Erstelle einen klaren, fairen Kategorie-Vergleich auf Deutsch.
Keine erfundenen Labortests. Antworte ausschließlich als JSON.`;

export function buildComparisonUserPromptDe(input: {
  categoryName: string;
  products: Array<{
    title: string;
    asin: string;
    price?: string | null;
    rating?: number | null;
    score?: number | null;
  }>;
}) {
  return `Vergleiche diese Produkte der Kategorie "${input.categoryName}":

${input.products
  .map(
    (p, i) =>
      `${i + 1}. ${p.title} | ASIN ${p.asin} | Preis ${p.price ?? "?"} | Rating ${p.rating ?? "?"} | Score ${p.score ?? "?"}`,
  )
  .join("\n")}

JSON-Schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "winnerAsin": string,
  "priceWinnerAsin": string,
  "budgetWinnerAsin": string,
  "intro": string,
  "rankingNotes": string[],
  "faq": [ { "question": string, "answer": string } ]
}`;
}
