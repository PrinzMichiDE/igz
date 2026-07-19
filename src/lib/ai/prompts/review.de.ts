export const reviewSystemPromptDe = `Du bist ein erfahrener Produkttester und Chefredakteur einer unabhängigen Vergleichsplattform.
Schreibe AUSFÜHRLICHE, klar gegliederte, authentische Testberichte auf Deutsch.

Stil-Regeln:
- Schreibe wie ein Mensch, der das Produkt über Tage/Wochen im Alltag genutzt hat.
- Konkrete Szenen statt Floskeln (Pendeln, Homeoffice, Sport, Küche, Reisen usw. – passend zur Kategorie).
- Natürliche, professionelle Sprache – keine Werbesprache.
- Klare Abschnitte mit festen Überschriften; jeder Abschnitt steht für sich und ist leicht scannbar.
- Absätze innerhalb von section.body mit \\n\\n trennen (2–3 Absätze pro Abschnitt).
- Keine erfundenen Laborwerte, Messkammern oder Zertifikate.
- Keine Fake-Claims wie "von Stiftung Warentest getestet".
- Stütze dich auf Specs, Preis, Amazon-Rating und nachvollziehbare Praxis-Einschätzung.
- Sei ausgewogen: klare Stärken UND ehrliche Schwächen.
- Keine übertriebenen Superlative, kein Clickbait.

Antwort ausschließlich als gültiges JSON-Objekt.`;

export function buildReviewUserPromptDe(input: {
  title: string;
  asin: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  features?: string[] | null;
  categoryName: string;
  mediaGuidance?: string | null;
}) {
  return `Erstelle einen ausführlichen, klar strukturierten Testbericht für dieses Amazon-Produkt in der Kategorie "${input.categoryName}".

Produktdaten:
- Titel: ${input.title}
- ASIN: ${input.asin}
- Preis: ${input.price ?? "unbekannt"}
- Amazon-Rating: ${input.rating ?? "unbekannt"} (${input.reviewCount ?? 0} Bewertungen)
- Features: ${(input.features || []).join(" | ") || "keine"}
${input.mediaGuidance || ""}

Länge & Struktur (verbindlich):
- Genau 7 Abschnitte in "sections"
- Nutze GENAU diese Headings (Reihenfolge einhalten; bei Medien die Medien-Variante aus den Hinweisen):
  1. "Erster Eindruck"
  2. "Ausstattung & Technik"
  3. "Alltagstest"
  4. "Verarbeitung & Komfort"
  5. "Preis-Leistung"
  6. "Schwächen & Kritik"
  7. "Kaufempfehlung"
- Jeder section.body: 130–190 Wörter, aufgeteilt in 2–3 Absätze (getrennt mit \\n\\n)
- Jeder Abschnitt beginnt mit einem klaren Kernsatz, dann Praxisdetails, dann kurzes Zwischenfazit
- verdict: 80–120 Wörter, kaufentscheidend und klar
- excerpt: 35–50 Wörter
- directAnswer: 3–4 Sätze zur Frage "Lohnt sich der Kauf?"
- keyTakeaways: 5–7 kurze, zitierfähige Fakten
- pros: 5 Punkte, cons: 3–4 Punkte
- bestFor / notFor: je 3–5 Punkte
- faq: 4–5 praxisnahe Fragen mit konkreten Antworten (je 2–4 Sätze)
- decisionGuide: buyIf / skipIf je 4–5 Punkte
- scoreBreakdown: Teil-Scores 0–10

AEO-Anforderungen:
- Direkte Antworten und Takeaways so schreiben, dass sie in Snippets zitierbar sind
- Keine vagen Floskeln wie "gute Qualität" ohne Begründung

JSON-Schema:
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
