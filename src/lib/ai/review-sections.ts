import type { EntertainmentCategorySlug } from "@/lib/entertainment";
import { isEntertainmentCategorySlug } from "@/lib/entertainment";

export const PRODUCT_REVIEW_HEADINGS_DE = [
  "Erster Eindruck",
  "Ausstattung & Technik",
  "Alltagstest",
  "Verarbeitung & Komfort",
  "Preis-Leistung",
  "Schwächen & Kritik",
  "Kaufempfehlung",
] as const;

export const PRODUCT_REVIEW_HEADINGS_EN = [
  "First impressions",
  "Specs & features",
  "Daily use",
  "Build & comfort",
  "Value for money",
  "Weaknesses & criticism",
  "Buying recommendation",
] as const;

const MEDIA_HEADINGS_DE: Record<
  EntertainmentCategorySlug,
  readonly string[]
> = {
  filme: [
    "Erster Eindruck",
    "Handlung & Tempo",
    "Bild & Ton",
    "Edition & Extras",
    "Preis-Leistung",
    "Schwächen & Kritik",
    "Kaufempfehlung",
  ],
  serien: [
    "Erster Eindruck",
    "Story & Figuren",
    "Staffel-Einstieg im Alltag",
    "Bild, Ton & Edition",
    "Preis-Leistung",
    "Schwächen & Kritik",
    "Kaufempfehlung",
  ],
  videospiele: [
    "Erster Eindruck",
    "Gameplay & Spielspaß",
    "Technik & Bedienung",
    "Inhalt & Spielzeit",
    "Preis-Leistung",
    "Schwächen & Kritik",
    "Kaufempfehlung",
  ],
};

const MEDIA_HEADINGS_EN: Record<
  EntertainmentCategorySlug,
  readonly string[]
> = {
  filme: [
    "First impressions",
    "Story & pacing",
    "Picture & sound",
    "Edition & extras",
    "Value for money",
    "Weaknesses & criticism",
    "Buying recommendation",
  ],
  serien: [
    "First impressions",
    "Story & characters",
    "Season opener in practice",
    "Picture, sound & edition",
    "Value for money",
    "Weaknesses & criticism",
    "Buying recommendation",
  ],
  videospiele: [
    "First impressions",
    "Gameplay & fun",
    "Tech & controls",
    "Content & playtime",
    "Value for money",
    "Weaknesses & criticism",
    "Buying recommendation",
  ],
};

export type ReviewSection = { heading: string; body: string };

export function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function expectedReviewHeadings(
  locale: "de" | "en",
  categorySlug?: string | null,
): readonly string[] {
  if (categorySlug && isEntertainmentCategorySlug(categorySlug)) {
    return locale === "en"
      ? MEDIA_HEADINGS_EN[categorySlug]
      : MEDIA_HEADINGS_DE[categorySlug];
  }
  return locale === "en"
    ? PRODUCT_REVIEW_HEADINGS_EN
    : PRODUCT_REVIEW_HEADINGS_DE;
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " und ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Enforce the fixed 7-section outline: keep body text, rewrite drifted headings.
 */
export function normalizeReviewSections(
  sections: ReviewSection[] | undefined,
  locale: "de" | "en",
  categorySlug?: string | null,
): ReviewSection[] {
  const expected = expectedReviewHeadings(locale, categorySlug);
  const incoming = (sections || [])
    .map((section) => ({
      heading: String(section.heading || "").trim(),
      body: String(section.body || "").trim(),
    }))
    .filter((section) => section.body.length > 0);

  if (incoming.length === 0) return [];

  const byHeading = new Map<string, ReviewSection>();
  for (const section of incoming) {
    byHeading.set(normalizeKey(section.heading), section);
  }

  const ordered: ReviewSection[] = [];
  const used = new Set<string>();

  for (const heading of expected) {
    const match = byHeading.get(normalizeKey(heading));
    if (match && !used.has(normalizeKey(match.heading))) {
      ordered.push({ heading, body: match.body });
      used.add(normalizeKey(match.heading));
      continue;
    }
    // Fall back to positional fill so we still keep 7 cards when the model
    // used near-equivalent titles (e.g. "Schwächen" → "Schwächen & Kritik").
    const next = incoming.find((section) => !used.has(normalizeKey(section.heading)));
    if (next) {
      ordered.push({ heading, body: next.body });
      used.add(normalizeKey(next.heading));
    }
  }

  return ordered.slice(0, expected.length);
}

export function sectionWordTotal(sections: ReviewSection[]) {
  return sections.reduce((sum, section) => sum + wordCount(section.body), 0);
}

export function hasClearSectionParagraphs(body: string) {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  return paragraphs.length >= 2;
}

export function isDetailedSectionedReview(
  sections: ReviewSection[],
  options?: { minSectionWords?: number; minLongSections?: number },
) {
  const minSectionWords = options?.minSectionWords ?? 110;
  const minLongSections = options?.minLongSections ?? 5;
  const longSections = sections.filter(
    (section) => wordCount(section.body) >= minSectionWords,
  );
  const withParagraphs = sections.filter((section) =>
    hasClearSectionParagraphs(section.body),
  );

  return (
    sections.length >= 7 &&
    longSections.length >= minLongSections &&
    withParagraphs.length >= 4 &&
    sectionWordTotal(sections) >= 700
  );
}
