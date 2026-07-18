export const techProfileSystemPrompt = `You are a technical product editor for an Amazon comparison site (IGZ).
You normalize messy Amazon product data into a bilingual technical datasheet and research known reliability issues / error codes.

Rules:
- Return ONLY valid JSON matching the schema in the user prompt.
- Use IDENTICAL stable snake_case keys for specs that should be comparable across products in the same category (e.g. battery_mah, weight_g, bluetooth_version, noise_cancelling, ip_rating, warranty_years).
- Prefer concrete values from the provided Amazon data. If a value is unknown, omit the row — do NOT invent measurements or certifications.
- Values must be short and comparable (numbers/units preferred). Put units in the unit field when possible.
- For knownIssues: list real, commonly reported problems for this exact model or very close variants. Prefer public reports (forums, Reddit, manufacturer notices, reputable review sites). Include source URLs when you know them. If you are not sure, mark status "unconfirmed" or return an empty issues array.
- Never invent laboratory test results. Never claim every unit is affected.
- For errorCodes: only include codes typical for this product family (device display codes, LED blink patterns, app codes). Provide practical remediation steps a user can try. If the product has no meaningful codes, return an empty codes array.
- German (De) and English (En) fields are both required for every text field.
- Keep lists concise and useful for shoppers comparing products.`;

export function buildTechProfileUserPrompt(input: {
  title: string;
  asin: string;
  brand?: string | null;
  categoryNameDe: string;
  categoryNameEn: string;
  categorySlug: string;
  price?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  features: string[];
  productInformation: Record<string, string>;
  aboutProduct: string[];
}) {
  const infoLines = Object.entries(input.productInformation)
    .slice(0, 60)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  const about = input.aboutProduct
    .slice(0, 30)
    .map((line) => `- ${line}`)
    .join("\n");

  const features = input.features
    .slice(0, 40)
    .map((line) => `- ${line}`)
    .join("\n");

  return `Normalize this Amazon product into a technical profile.

Product:
- Title: ${input.title}
- ASIN: ${input.asin}
- Brand hint: ${input.brand || "unknown"}
- Category DE: ${input.categoryNameDe}
- Category EN: ${input.categoryNameEn}
- Category slug: ${input.categorySlug}
- Price: ${input.price || "n/a"}
- Amazon rating: ${input.rating ?? "n/a"} (${input.reviewCount ?? 0} reviews)

Amazon product_information:
${infoLines || "- (none)"}

Amazon about_product / features:
${about || features || "- (none)"}

Legacy feature list:
${features || "- (none)"}

Return JSON with this exact shape:
{
  "datasheet": {
    "brandHint": "string",
    "modelHint": "string",
    "sourceNotesDe": "short note",
    "sourceNotesEn": "short note",
    "rows": [
      {
        "key": "stable_snake_case",
        "labelDe": "Deutsches Label",
        "labelEn": "English label",
        "value": "short value",
        "unit": "optional unit",
        "groupDe": "Gruppe",
        "groupEn": "Group",
        "sortOrder": 1
      }
    ]
  },
  "knownIssues": {
    "disclaimerDe": "...",
    "disclaimerEn": "...",
    "issues": [
      {
        "titleDe": "...",
        "titleEn": "...",
        "summaryDe": "...",
        "summaryEn": "...",
        "severity": "low|medium|high",
        "status": "reported|widespread|fixed_in_update|unconfirmed",
        "sources": [{ "title": "...", "url": "https://..." }]
      }
    ]
  },
  "errorCodes": {
    "noteDe": "...",
    "noteEn": "...",
    "codes": [
      {
        "code": "E01 / LED blinks 3x",
        "meaningDe": "...",
        "meaningEn": "...",
        "stepsDe": ["Geraet neu starten", "Kabel/Verbindung pruefen"],
        "stepsEn": ["Restart the device", "Check cable/connection"],
        "severity": "low|medium|high"
      }
    ]
  }
}

Target 8-20 datasheet rows with category-stable keys. Prefer empty arrays over guesses for issues/codes.`;
}
