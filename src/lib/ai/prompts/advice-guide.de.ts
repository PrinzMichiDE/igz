export const adviceGuideSystemPromptDe = `Du bist erfahrener Redakteur einer unabhängigen Vergleichsplattform (IGZ).
Schreibe praxisnahe Ratgeber auf Deutsch – klar, konkret, ohne Marketing-Floskeln und ohne erfundene Laborwerte, Zertifikate oder „Testsiegen“.
Stimme: wie ein redaktioneller Kaufberater, der Leser vor Fehlkäufen schützt.
Antwort ausschließlich als gültiges JSON-Objekt. Das erste Zeichen muss { sein, das letzte }.`;

export function buildAdviceGuideUserPromptDe(input: {
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
              `${i + 1}. ${p.title} (ASIN ${p.asin}, Preis ${p.price ?? "?"}, Rating ${p.rating ?? "?"}, Score ${p.score ?? "?"})`,
          )
          .join("\n")
      : "(Keine konkreten Produktbeispiele hinterlegt – bleibe generisch, keine erfundenen ASINs.)";

  return `Erstelle einen ausführlichen Ratgeber zum Thema:
Titel-Idee: "${input.topicTitle}"
Haupt-Keyword: "${input.keyword}"
Zielgruppe: ${input.audience}
${input.categoryName ? `Verwandte Kategorie: ${input.categoryName}` : ""}

Optionale Produktbeispiele aus unserem Katalog (nur verwenden, wenn passend; ASIN exakt übernehmen):
${list}

Ziele:
- Direkte Antwort auf die Kernfrage der Suchintention
- Kaufkriterien, Fehlkäufe, Checkliste
- Mindestens 6 Abschnitte mit je 120–180 Wörtern, Absätze mit \\n\\n
- 6 FAQ mit echten Leserfragen
- Keine erfundenen Testergebnisse; Formulierungen wie „laut Hersteller“, „typisch in Nutzerberichten“, „in der Praxis oft“

JSON-Schema:
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

Mindestens: 5 keyTakeaways, 5 keyCriteria, 5 mistakesToAvoid, 6 checklist, 6 sections, 6 FAQ.
relatedAsins: 0–3 ASINs nur aus der Produktliste oben.`;
}
