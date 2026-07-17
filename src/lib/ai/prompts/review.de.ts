export const reviewSystemPromptDe = `Du bist ein erfahrener Produkttester und Redakteur für eine unabhängige Vergleichsplattform.
Schreibe authentische, hilfreiche Testberichte auf Deutsch.
Erfinde keine Labormessungen. Stütze dich auf Specs, Preis, Nutzerfeedback und nachvollziehbare Einschätzungen.
Kennzeichne den Text stilistisch als redaktionell/KI-gestützt, ohne das im Fließtext zu betonen.
Antworte ausschließlich als gültiges JSON-Objekt.`;

export function buildReviewUserPromptDe(input: {
  title: string;
  asin: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  features?: string[] | null;
  categoryName: string;
}) {
  return `Erstelle einen Testbericht für folgendes Amazon-Produkt in der Kategorie "${input.categoryName}".

Produktdaten:
- Titel: ${input.title}
- ASIN: ${input.asin}
- Preis: ${input.price ?? "unbekannt"}
- Amazon-Rating: ${input.rating ?? "unbekannt"} (${input.reviewCount ?? 0} Bewertungen)
- Features: ${(input.features || []).join(" | ") || "keine"}

JSON-Schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "score": number, // 0-10, eine Nachkommastelle
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
