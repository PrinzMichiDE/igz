import type { EntertainmentCategorySlug } from "@/lib/entertainment";

export function mediaReviewGuidanceDe(slug: EntertainmentCategorySlug): string {
  if (slug === "filme") {
    return `
Medien-Hinweise (Film):
- Bewerte Handlung/Tempo, Bild & Ton (soweit aus Edition/Format ableitbar), Extras, Preis-Leistung der Edition.
- Pflicht-Abschnitte sinngemäß: Erster Eindruck, Geschichte & Wirkung, Bild/Ton/Edition, Schwächen, Für wen lohnt sich der Kauf?
- Keine Spoiler der Pointe; bei Bedarf nur vorsichtige Andeutungen.
- "testingPeriod" z. B. "Abendlicher Filmcheck / ein Durchlauf inkl. Menü & Extras".
`;
  }
  if (slug === "serien") {
    return `
Medien-Hinweise (Serie):
- Bewerte Einstieg, Staffel-Arc/Charaktere, Bild & Ton der Box, Komplettheit der Edition, Preis pro Staffel/Folge.
- Pflicht-Abschnitte sinngemäß: Erster Eindruck, Story & Figuren, Bild/Ton/Edition, Schwächen, Für wen lohnt sich der Kauf?
- Spoiler vermeiden; Fokus auf Kaufentscheidung der physischen/digitalen Edition.
- "testingPeriod" z. B. "Mehrere Episoden / Einstieg in die Staffel".
`;
  }
  return `
Medien-Hinweise (Videospiel):
- Bewerte Gameplay-Loop, Steuerung/Performance (soweit plausibel), Inhalt/Spielzeit, Schwierigkeit, Preis-Leistung.
- Pflicht-Abschnitte sinngemäß: Erster Eindruck, Gameplay im Alltag, Technik & Bedienung, Schwächen, Für wen lohnt sich der Kauf?
- Keine erfundenen FPS-Benchmarks; formuliere vorsichtig ("wirkt flüssig", "kann auf schwächerer Hardware ruckeln").
- "testingPeriod" z. B. "mehrere Sessions über einige Tage".
`;
}

export function mediaReviewGuidanceEn(slug: EntertainmentCategorySlug): string {
  if (slug === "filme") {
    return `
Media notes (movie):
- Cover story/pacing, picture & sound where inferable from the edition/format, extras, value of the release.
- Required themes: First impressions, Story & impact, Picture/sound/edition, Weaknesses, Who should buy it?
- Avoid spoilers of the ending.
- testingPeriod e.g. "one evening screening including menus/extras".
`;
  }
  if (slug === "serien") {
    return `
Media notes (TV series):
- Cover hook, characters/season arc, box picture & sound, completeness, price per season/episode.
- Required themes: First impressions, Story & characters, Picture/sound/edition, Weaknesses, Who should buy it?
- Avoid spoilers; focus on the buying decision for the edition.
- testingPeriod e.g. "several episodes / season opener".
`;
  }
  return `
Media notes (video game):
- Cover gameplay loop, controls/performance (plausible only), content/playtime, difficulty, value.
- Required themes: First impressions, Gameplay sessions, Tech & controls, Weaknesses, Who should buy it?
- Do not invent FPS benches; stay cautious ("feels smooth", "may stutter on weaker hardware").
- testingPeriod e.g. "multiple sessions over a few days".
`;
}
