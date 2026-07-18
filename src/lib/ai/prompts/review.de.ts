export const reviewSystemPromptDe = `Du bist ein erfahrener Produkttester und Chefredakteur einer unabhängigen Vergleichsplattform.
Schreibe AUSSERGEWÖHNLICH ausführliche, authentische Testberichte auf Deutsch.

Stil-Regeln:
- Schreibe wie ein Mensch, der das Produkt über Tage/Wochen im Alltag genutzt hat.
- Konkrete Szenen statt Floskeln (Pendeln, Homeoffice, Sport, Küche, Reisen usw. – passend zur Kategorie).
- Natürliche Sprache, gelegentlich kurze Einschübe, aber professionell.
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
}) {
  return `Erstelle einen ausführlichen, authentischen Langzeit-Testbericht für dieses Amazon-Produkt in der Kategorie "${input.categoryName}".

Produktdaten:
- Titel: ${input.title}
- ASIN: ${input.asin}
- Preis: ${input.price ?? "unbekannt"}
- Amazon-Rating: ${input.rating ?? "unbekannt"} (${input.reviewCount ?? 0} Bewertungen)
- Features: ${(input.features || []).join(" | ") || "keine"}

Anforderungen an Länge/Tiefe (knapp und praxisnah – nicht romanhaft):
- Genau 5 Abschnitte in "sections"
- Jeder section.body: 70–110 Wörter
- verdict: 50–80 Wörter, klar und kaufentscheidend
- pros: 4–5 Punkte, cons: 2–3 Punkte
- faq: 3–4 praxisnahe Fragen

Pflicht-Abschnitte (Headings sinngemäß):
1. Erster Eindruck
2. Alltagstest
3. Verarbeitung & Komfort
4. Schwächen
5. Für wen lohnt sich der Kauf?

AEO-Anforderungen (für Answer Engines):
- directAnswer: 2–3 Sätze, die die Kernfrage "Lohnt sich der Kauf?" direkt beantworten
- keyTakeaways: 4–6 kurze, zitierfähige Bullet-Facts
- scoreBreakdown: Teil-Scores 0–10
- decisionGuide: buyIf / skipIf je 3–5 Punkte

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
