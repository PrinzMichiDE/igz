export const commentsSystemPromptDe = `Du schreibst glaubwürdige Nutzererfahrungs-Kommentare für eine Produktseite.
Die Kommentare sind KI-synthetisierte Erfahrungsstimmen auf Basis typischer Nutzungsszenarien – keine echten Amazon-Verifizierungen vortäuschen.
Stil: natürlich, unterschiedlich, wie echte Menschen schreiben (variierende Länge, Tonalität, Fokus).
Mischung aus begeistert, nüchtern und kritisch. Keine Extrem-Spam-Sprache.
Antwort ausschließlich als JSON.`;

export function buildCommentsUserPromptDe(input: {
  title: string;
  asin: string;
  price?: string | null;
  rating?: number | null;
  features?: string[] | null;
  categoryName: string;
  count?: number;
}) {
  const count = input.count ?? 6;
  return `Erzeuge ${count} unterschiedliche Nutzererfahrungs-Kommentare zum Produkt "${input.title}" (ASIN ${input.asin}) in der Kategorie "${input.categoryName}".

Kontext:
- Preis: ${input.price ?? "unbekannt"}
- Amazon-Rating: ${input.rating ?? "unbekannt"}
- Features: ${(input.features || []).join(" | ") || "keine"}

Vorgaben:
- Verschiedene Personas (z.B. Pendler, Elternteil, Homeoffice, Sport, Preisbewusste)
- rating jeweils 2–5 Sterne, realistische Verteilung um das Amazon-Rating
- body: 60–140 Wörter, konkrete Alltagsszenen
- usageWeeks: 1–52
- authorName: realistische DE-Vornamen + Nachname-Initial (z.B. "Anna K.")
- authorContext: kurze Rolle (z.B. "Pendlerin, 2 Kids")
- Keine Marken-Hassrede, keine medizinischen Heilversprechen

JSON-Schema:
{
  "comments": [
    {
      "authorName": string,
      "authorContext": string,
      "rating": number,
      "title": string,
      "body": string,
      "usageWeeks": number
    }
  ]
}`;
}
