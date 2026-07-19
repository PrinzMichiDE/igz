import type { EntertainmentCategorySlug } from "@/lib/entertainment";

export function mediaReviewGuidanceDe(slug: EntertainmentCategorySlug): string {
  if (slug === "filme") {
    return `
Medien-Hinweise (Film) – nutze diese 7 Headings statt der Standard-Headings:
1. "Erster Eindruck"
2. "Handlung & Tempo"
3. "Bild & Ton"
4. "Edition & Extras"
5. "Preis-Leistung"
6. "Schwächen & Kritik"
7. "Kaufempfehlung"
- Keine Spoiler der Pointe; bei Bedarf nur vorsichtige Andeutungen.
- Ton wie Filmkritik in einer guten Zeitung: Beobachtung, Tempo, Atmosphäre – keine Fanfiction.
- "testingPeriod" z. B. "Abendlicher Filmabend inkl. Menü & Extras".
`;
  }
  if (slug === "serien") {
    return `
Medien-Hinweise (Serie) – nutze diese 7 Headings statt der Standard-Headings:
1. "Erster Eindruck"
2. "Story & Figuren"
3. "Staffel-Einstieg im Alltag"
4. "Bild, Ton & Edition"
5. "Preis-Leistung"
6. "Schwächen & Kritik"
7. "Kaufempfehlung"
- Spoiler vermeiden; Fokus auf Kaufentscheidung der Edition.
- Ton wie Serien-Kritik: Figuren, Einstieg, Bingewürdigkeit – redaktionell, nicht spoilernd.
- "testingPeriod" z. B. "Mehrere Episoden / Einstieg in die Staffel".
`;
  }
  return `
Medien-Hinweise (Videospiel) – nutze diese 7 Headings statt der Standard-Headings:
1. "Erster Eindruck"
2. "Gameplay & Spielspaß"
3. "Technik & Bedienung"
4. "Inhalt & Spielzeit"
5. "Preis-Leistung"
6. "Schwächen & Kritik"
7. "Kaufempfehlung"
- Keine erfundenen FPS-Benchmarks; formuliere vorsichtig.
- Ton wie Spiele-Redaktion: Session-Feeling, Steuerung, Frust/Spaß – keine Trailer-Sprache.
- "testingPeriod" z. B. "mehrere Sessions über einige Tage".
`;
}

export function mediaReviewGuidanceEn(slug: EntertainmentCategorySlug): string {
  if (slug === "filme") {
    return `
Media notes (movie) — use these 7 headings instead of the default ones:
1. "First impressions"
2. "Story & pacing"
3. "Picture & sound"
4. "Edition & extras"
5. "Value for money"
6. "Weaknesses & criticism"
7. "Buying recommendation"
- Avoid spoilers of the ending.
- Tone like a newspaper film critic: observation, pacing, atmosphere — not fan copy.
- testingPeriod e.g. "one evening screening including menus/extras".
`;
  }
  if (slug === "serien") {
    return `
Media notes (TV series) — use these 7 headings instead of the default ones:
1. "First impressions"
2. "Story & characters"
3. "Season opener in practice"
4. "Picture, sound & edition"
5. "Value for money"
6. "Weaknesses & criticism"
7. "Buying recommendation"
- Avoid spoilers; focus on the buying decision for the edition.
- Tone like a TV critic: characters, entry point, bingeability — editorial, not spoiler-y.
- testingPeriod e.g. "several episodes / season opener".
`;
  }
  return `
Media notes (video game) — use these 7 headings instead of the default ones:
1. "First impressions"
2. "Gameplay & fun"
3. "Tech & controls"
4. "Content & playtime"
5. "Value for money"
6. "Weaknesses & criticism"
7. "Buying recommendation"
- Do not invent FPS benches; stay cautious.
- Tone like a games desk: session feel, controls, friction/fun — no trailer speak.
- testingPeriod e.g. "multiple sessions over a few days".
`;
}
