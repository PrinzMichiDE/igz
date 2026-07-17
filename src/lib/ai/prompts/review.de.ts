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

Anforderungen an Länge/Tiefe:
- Mindestens 7 Abschnitte in "sections"
- Jeder section.body: 120–220 Wörter
- verdict: 80–140 Wörter, klar und kaufentscheidend
- pros: 5–7 Punkte, cons: 3–5 Punkte
- faq: 5 praxisnahe Fragen

Pflicht-Abschnitte (Headings sinngemäß, Reihenfolge frei):
1. Erster Eindruck / Unboxing
2. Alltagstest (konkrete Nutzungsszenen)
3. Verarbeitung & Komfort / Handhabung
4. Leistung im Vergleich zur Preisklasse
5. Lautstärke/Akku/Bedienung – je nach Produktrelevant
6. Schwächen nach längerer Nutzung
7. Für wen lohnt sich der Kauf wirklich?

JSON-Schema:
{
  "title": string,
  "excerpt": string,
  "seoTitle": string,
  "seoDescription": string,
  "score": number,
  "testingPeriod": string,
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
