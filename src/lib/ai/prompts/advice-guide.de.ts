export const adviceGuideSystemPromptDe = `Du bist Autor eines praxisnahen Wissensmagazins (IGZ Ratgeber).
Schreibe How-to-Artikel auf Deutsch – wie „Wie reinige ich AirPods richtig?“: klar, schrittweise, alltagstauglich.
Kein Kaufberatungs-Marketing, keine erfundenen Laborwerte, Zertifikate oder „Testsiege“.
Stimme: hilfreiches Magazin mit Checklisten und typischen Fehlern – nicht wie ein Shop-Text.
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
      : "(Keine Produktbeispiele – bleibe generisch, keine erfundenen ASINs. Erwähne Marken nur als Beispiele.)";

  return `Erstelle einen ausführlichen Wissensmagazin-/How-to-Artikel:
Titel-Idee: "${input.topicTitle}"
Haupt-Keyword: "${input.keyword}"
Zielgruppe: ${input.audience}
${input.categoryName ? `Verwandte Produktwelt (nur optional am Rand): ${input.categoryName}` : ""}

Optionale Produktbeispiele aus unserem Katalog (höchstens sanft am Ende erwähnen; ASIN exakt):
${list}

Ziele & Ton:
- Beantworte eine konkrete Praxisfrage (Pflege, Reinigung, Einrichtung, Wartung, Alltagstipp)
- Schreibe wie ein Magazin-How-to: Motivation → Vorbereitung → Schritte → Fehler → FAQ
- Kein klassischer „Kaufberatung / Testsieger“-Aufbau
- Mindestens 6 Abschnitte mit je 120–180 Wörtern, Absätze mit \\n\\n
- 6 FAQ mit echten Leserfragen („Darf ich …?“, „Wie oft …?“, „Was passiert wenn …?“)
- Sicherheitshinweise klar benennen (Wasser, Strom, Garantie, aggressive Chemie)
- Formulierungen wie „in der Praxis oft“, „laut Hersteller-Hinweis“, „besser vermeiden“ – keine erfundenen Tests

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

Feldbedeutung in diesem Magazin-Format:
- keyCriteria = „Das brauchst du“ / Voraussetzungen / Werkzeug & Material
- mistakesToAvoid = typische Fehler (z. B. falsche Reiniger, zu nass, Garantie riskieren)
- checklist = nummerierbare Schritt-für-Schritt-Checkliste zum Abhaken
- sections = ausführliche Erklärungen (Warum, Wie, Varianten, Pflege-Intervalle)

Mindestens: 5 keyTakeaways, 5 keyCriteria, 5 mistakesToAvoid, 6 checklist, 6 sections, 6 FAQ.
relatedAsins: 0–2 ASINs nur aus der Liste oben (optional).`;
}
