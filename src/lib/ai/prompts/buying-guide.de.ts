export const buyingGuideSystemPromptDe = `Du bist ein erfahrener Kaufberater für eine unabhängige Vergleichsplattform.
Schreibe praxisnahe, SEO-starke Kaufberatungen auf Deutsch – ohne erfundene Tests oder Laborwerte.

Antwort ausschließlich als gültiges JSON-Objekt.`;

export function buildBuyingGuideUserPromptDe(input: {
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
        `${i + 1}. ${p.title} (ASIN ${p.asin}, Preis ${p.price ?? "?"}, Rating ${p.rating ?? "?"}, Score ${p.score ?? "?"})`,
    )
    .join("\n");

  return `Erstelle eine umfassende Kaufberatung für die Kategorie "${input.categoryName}".

Produkte im Vergleich:
${list}

Ziel: Leser sollen verstehen, worauf sie beim Kauf achten müssen, welche Fehlkäufe sie vermeiden und welches Modell für welches Budget/Szenario passt.

JSON-Schema:
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

Mindestens 5 sections mit je 100+ Wörtern, 6 FAQ, 5 keyCriteria, 3 budgetTiers.`;
}
