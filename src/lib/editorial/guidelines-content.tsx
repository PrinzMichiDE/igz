import type { ReactNode } from "react";
import Link from "next/link";

type Section = {
  id: string;
  title: string;
  body: ReactNode;
};

export function getEditorialGuidelineSections(locale: "de" | "en"): Section[] {
  return locale === "en" ? guidelinesEn() : guidelinesDe();
}

function InternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-blue-700 hover:underline">
      {children}
    </Link>
  );
}

const guidelinesDe = (): Section[] => [
  {
    id: "auftrag",
    title: "1. Auftrag der Redaktion",
    body: (
      <>
        <p>
          IGZ Vergleich hilft bei Kaufentscheidungen mit klaren, nachvollziehbaren
          Tests und Vergleichen. Wir schreiben für Leserinnen und Leser – nicht
          für Hersteller, nicht für Algorithmen allein.
        </p>
        <p className="mt-3">
          Unser Maßstab: Ein Test soll sich lesen wie von einer erfahrenen
          Redaktion. Er soll Orientierung geben, Stärken und Schwächen benennen
          und am Ende eine klare Kaufhaltung haben.
        </p>
      </>
    ),
  },
  {
    id: "unabhaengigkeit",
    title: "2. Unabhängigkeit & Affiliate",
    body: (
      <>
        <p>
          Amazon-Links auf IGZ sind Affiliate-Links. Wenn über einen solchen Link
          ein Kauf zustande kommt, kann IGZ eine Provision erhalten – ohne
          Mehrkosten für dich.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Provisionen beeinflussen weder Score noch Ranking in
            Vergleichstabellen.
          </li>
          <li>
            Produkte werden nicht gegen Zahlung besser bewertet oder höher
            platziert.
          </li>
          <li>
            Affiliate-Hinweise sind sichtbar (u. a. im Header-/Footer-Bereich und
            an CTAs).
          </li>
        </ul>
        <p className="mt-3">
          Details zur Arbeitsweise findest du auch in der{" "}
          <InternalLink href="/de/methodik">Methodik</InternalLink>.
        </p>
      </>
    ),
  },
  {
    id: "datenbasis",
    title: "3. Datenbasis",
    body: (
      <>
        <p>Jeder Test stützt sich auf nachvollziehbare Produktdaten:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Amazon-Titel, Preis, Währung, Verfügbarkeitssignale</li>
          <li>Amazon-Bewertung und Anzahl der Bewertungen</li>
          <li>Produktmerkmale / Feature-Listen</li>
          <li>Bilder und – soweit vorhanden – Dokumente/Handbücher</li>
          <li>KI-normalisierte Specs für den Kategorievergleich</li>
        </ul>
        <p className="mt-3">
          Seitenaufrufe lösen keine Live-Amazon-API-Calls aus. Daten werden
          gecacht und periodisch aktualisiert. Preise und Verfügbarkeit können
          sich kurzfristig ändern.
        </p>
      </>
    ),
  },
  {
    id: "ki-unterstuetzung",
    title: "4. KI-gestützte Redaktion",
    body: (
      <>
        <p>
          Testberichte, Vergleiche und Teile der Spezifikations-Normalisierung
          werden KI-gestützt erstellt und redaktionell gerahmt. Das bedeutet:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Inhalte orientieren sich an Specs, Preis, Amazon-Signalen und
            plausibler Praxis-Einschätzung.
          </li>
          <li>
            Es werden keine Laborwerte, Messkammern oder Zertifikate erfunden.
          </li>
          <li>
            Es werden keine Tests Dritter (z. B. „Stiftung Warentest“) behauptet,
            die uns nicht vorliegen.
          </li>
          <li>
            Ein Quality-Gate prüft u. a. Länge, Abschnittsstruktur, Pros/Cons und
            Direktantworten.
          </li>
        </ul>
        <p className="mt-3">
          KI ersetzt keine unabhängige Labormessung. Sie hilft, große
          Produktmengen strukturiert und lesbar einzuordnen.
        </p>
      </>
    ),
  },
  {
    id: "teststruktur",
    title: "5. Aufbau eines Testberichts",
    body: (
      <>
        <p>
          Ausführliche Produkttests folgen einem festen, scannbaren Aufbau mit
          genau sieben Abschnitten:
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Erster Eindruck</li>
          <li>Ausstattung & Technik</li>
          <li>Alltagstest</li>
          <li>Verarbeitung & Komfort</li>
          <li>Preis-Leistung</li>
          <li>Schwächen & Kritik</li>
          <li>Kaufempfehlung</li>
        </ol>
        <p className="mt-3">
          Zusätzlich gehören dazu: Direktantwort („Lohnt sich der Kauf?“),
          Fazit, Key Takeaways, Pros/Cons, Zielgruppen, FAQ und ein
          Entscheidungsweg (kaufen / weglassen).
        </p>
        <p className="mt-3">
          Für Medien (Filme, Serien, Videospiele) gelten angepasste Abschnitte –
          spoilerarm und mit Fokus auf Edition bzw. Spielspaß.
        </p>
      </>
    ),
  },
  {
    id: "stil",
    title: "6. Stil & Sprache",
    body: (
      <>
        <p>Redaktioneller Ton heißt bei uns:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Praxisnah: konkrete Alltagsszenen statt abstrakter Werbesprache
          </li>
          <li>
            Meinungsstark, aber fair: Stärken und Schwächen gleichermaßen
          </li>
          <li>
            Natürliche Sprache: im Praxisteil oft Ich-Form, im Fazit ruhig und
            klar
          </li>
          <li>Kein Clickbait, keine Superlativ-Orgie, keine Influencer-Slang</li>
        </ul>
        <p className="mt-3 font-medium text-zinc-900">Typische Verbote</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Floskeln wie „Gamechanger“, „Revolution“, „perfekt für alle“, „echtes
            Highlight“ ohne Beleg
          </li>
          <li>Dieselbe Kritikphrase in jedem Abschnitt wiederholen</li>
          <li>
            Falschen Formfaktor erfinden (z. B. In-Ears als Over-Ears
            beschreiben)
          </li>
          <li>Heilversprechen, Angstmacherei, unbelegte Rankings</li>
        </ul>
      </>
    ),
  },
  {
    id: "scoring",
    title: "7. Scores & Rankings",
    body: (
      <>
        <p>
          Der redaktionelle IGZ-Score liegt zwischen 0 und 10. Er berücksichtigt
          typischerweise:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Preis-Leistung</li>
          <li>Verarbeitung / Qualität</li>
          <li>Alltagstauglichkeit</li>
          <li>Langzeitnutzen / Plausibilität der Ausstattung</li>
        </ul>
        <p className="mt-3">
          Amazon-Sterne und Verkaufssignale fließen als Kontext ein, ersetzen aber
          nicht die redaktionelle Einordnung. In Kategorievergleichen und
          Bestenlisten zählt der redaktionelle Score – nicht die Affiliate-
          Provision.
        </p>
      </>
    ),
  },
  {
    id: "vergleiche",
    title: "8. Vergleiche & Bestenlisten",
    body: (
      <>
        <p>
          Kategorievergleiche und Bestenlisten sollen schnell entscheiden helfen:
          Wer führt, wer ist Preis-Tipp, wer eher Spezialfall.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Produkte einer Kategorie werden mit gleichen Spec-Keys verglichen</li>
          <li>Unbekannte Werte werden weggelassen statt erfunden</li>
          <li>
            Rankings können sich ändern, wenn Preise, Specs oder Scores
            aktualisiert werden
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "erfahrungen",
    title: "9. Nutzererfahrungen",
    body: (
      <>
        <p>Auf Produktseiten können Erfahrungsberichte erscheinen:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <strong>Nutzerberichte</strong>: von Leserinnen und Lesern
            eingereicht, vor Veröffentlichung geprüft und entsprechend
            gekennzeichnet
          </li>
          <li>
            <strong>Redaktionelle Erfahrungsstimmen</strong>: typische
            Nutzungsszenarien zur Einordnung – keine verifizierten Amazon-Käufe
          </li>
        </ul>
        <p className="mt-3">
          Wir kennzeichnen Nutzerberichte klar. KI-gestützte Stimmen werden nicht
          als echte verifizierte Käufer ausgegeben.
        </p>
      </>
    ),
  },
  {
    id: "korrekturen",
    title: "10. Aktualisierung & Korrekturen",
    body: (
      <>
        <p>
          Produktdaten und Inhalte werden laufend bzw. in Batches aktualisiert.
          Wenn dir ein sachlicher Fehler auffällt:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Kontaktdaten stehen im{" "}
            <InternalLink href="/de/impressum">Impressum</InternalLink>
          </li>
          <li>
            Bitte Produktseite/URL und den vermuteten Fehler kurz beschreiben
          </li>
        </ul>
        <p className="mt-3">
          Wir korrigieren nachvollziehbare Fehler und aktualisieren betroffene
          Passagen, Spezifikationen oder Rankings.
        </p>
      </>
    ),
  },
  {
    id: "transparenz",
    title: "11. Transparenz für Leser & KI-Systeme",
    body: (
      <>
        <p>
          Für Menschen und Answer Engines halten wir zentrale Regeln öffentlich:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <InternalLink href="/de/methodik">Methodik</InternalLink> –
            Arbeitsweise & Score-Logik
          </li>
          <li>
            <InternalLink href="/de/ueber-uns">Über uns</InternalLink> – wer wir
            sind
          </li>
          <li>
            <InternalLink href="/de/datenschutz">Datenschutz</InternalLink> –
            Datenverarbeitung
          </li>
          <li>
            <InternalLink href="/de/impressum">Impressum</InternalLink> –
            Anbieterkennzeichnung
          </li>
        </ul>
        <p className="mt-3">
          Diese Richtlinien sind verbindlicher Rahmen für Ton, Struktur und
          redaktionelle Grenzen auf IGZ.
        </p>
      </>
    ),
  },
];

const guidelinesEn = (): Section[] => [
  {
    id: "mission",
    title: "1. Editorial mission",
    body: (
      <>
        <p>
          IGZ Vergleich helps people make buying decisions with clear,
          understandable tests and comparisons. We write for readers — not for
          manufacturers, and not for algorithms alone.
        </p>
        <p className="mt-3">
          Our standard: a review should read like it came from an experienced
          desk. It should orient the reader, name strengths and weaknesses, and
          end with a clear buying stance.
        </p>
      </>
    ),
  },
  {
    id: "independence",
    title: "2. Independence & affiliates",
    body: (
      <>
        <p>
          Amazon links on IGZ are affiliate links. If a purchase is made through
          such a link, IGZ may earn a commission — at no extra cost to you.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Commissions do not influence scores or rankings in comparison tables.
          </li>
          <li>
            Products are not rated higher or ranked better in exchange for
            payment.
          </li>
          <li>
            Affiliate disclosures are shown (including near CTAs and in site
            chrome).
          </li>
        </ul>
        <p className="mt-3">
          More on our process is on the{" "}
          <InternalLink href="/en/methodik">methodology page</InternalLink>.
        </p>
      </>
    ),
  },
  {
    id: "data",
    title: "3. Data basis",
    body: (
      <>
        <p>Every review is grounded in traceable product data:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Amazon title, price, currency, availability signals</li>
          <li>Amazon rating and review count</li>
          <li>Feature lists</li>
          <li>Images and manuals/documents when available</li>
          <li>AI-normalized specs for category comparisons</li>
        </ul>
        <p className="mt-3">
          Page views do not trigger live Amazon API calls. Data is cached and
          refreshed in batches. Prices and availability can change quickly.
        </p>
      </>
    ),
  },
  {
    id: "ai-assisted",
    title: "4. AI-assisted editing",
    body: (
      <>
        <p>
          Reviews, comparisons and parts of spec normalization are AI-assisted
          and editorially framed. That means:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Content is based on specs, price, Amazon signals and plausible
            hands-on judgment.
          </li>
          <li>We do not invent lab scores, chambers or certificates.</li>
          <li>
            We do not claim third-party awards (e.g. Stiftung Warentest) that were
            not provided.
          </li>
          <li>
            A quality gate checks length, section structure, pros/cons and direct
            answers.
          </li>
        </ul>
        <p className="mt-3">
          AI is not a substitute for independent lab testing. It helps structure
          large catalogs into readable guidance.
        </p>
      </>
    ),
  },
  {
    id: "structure",
    title: "5. Review structure",
    body: (
      <>
        <p>
          Long-form product tests follow a fixed, scannable outline with exactly
          seven sections:
        </p>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>First impressions</li>
          <li>Specs & features</li>
          <li>Daily use</li>
          <li>Build & comfort</li>
          <li>Value for money</li>
          <li>Weaknesses & criticism</li>
          <li>Buying recommendation</li>
        </ol>
        <p className="mt-3">
          They also include a direct answer (“Is it worth buying?”), verdict, key
          takeaways, pros/cons, audience fit, FAQ and a buy/skip guide.
        </p>
        <p className="mt-3">
          For media (movies, series, games) we use adapted section headings —
          spoiler-light, with focus on the edition or play experience.
        </p>
      </>
    ),
  },
  {
    id: "voice",
    title: "6. Voice & language",
    body: (
      <>
        <p>Editorial tone for us means:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Practical: concrete daily scenes instead of abstract marketing talk
          </li>
          <li>Opinionated but fair: strengths and weaknesses both named</li>
          <li>
            Natural language: first person in hands-on parts, calmer in the
            verdict
          </li>
          <li>No clickbait, no superlative spam, no influencer slang</li>
        </ul>
        <p className="mt-3 font-medium text-zinc-900">Typical bans</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Fluff like “game changer”, “revolutionary”, “perfect for everyone”,
            “must-have” without evidence
          </li>
          <li>Repeating the same criticism phrase in every section</li>
          <li>
            Wrong form factor (e.g. describing earbuds as over-ear headphones)
          </li>
          <li>Medical claims, scare tactics, unverifiable rankings</li>
        </ul>
      </>
    ),
  },
  {
    id: "scoring",
    title: "7. Scores & rankings",
    body: (
      <>
        <p>
          The editorial IGZ score ranges from 0 to 10. It typically considers:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Value for money</li>
          <li>Build / quality</li>
          <li>Everyday usability</li>
          <li>Longevity / plausibility of the feature set</li>
        </ul>
        <p className="mt-3">
          Amazon stars and sales signals are context, not a replacement for
          editorial judgment. Category comparisons and best-of lists use the
          editorial score — not affiliate commission.
        </p>
      </>
    ),
  },
  {
    id: "comparisons",
    title: "8. Comparisons & best-of lists",
    body: (
      <>
        <p>
          Category comparisons and best-of lists should help decide quickly: who
          leads, who is the value pick, who is a niche fit.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Products in a category share the same spec keys</li>
          <li>Unknown values are omitted rather than invented</li>
          <li>
            Rankings can change when prices, specs or scores are refreshed
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "experiences",
    title: "9. User experiences",
    body: (
      <>
        <p>Product pages may show experience notes:</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <strong>User reports</strong>: submitted by readers, moderated before
            publishing and labeled accordingly
          </li>
          <li>
            <strong>Editorial experience notes</strong>: typical usage scenarios
            for orientation — not verified Amazon purchases
          </li>
        </ul>
        <p className="mt-3">
          User reports are clearly labeled. AI-assisted notes are not presented
          as verified buyer reviews.
        </p>
      </>
    ),
  },
  {
    id: "corrections",
    title: "10. Updates & corrections",
    body: (
      <>
        <p>
          Product data and content are refreshed continuously or in batches. If
          you spot a factual error:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Contact details are in the{" "}
            <InternalLink href="/en/impressum">imprint</InternalLink>
          </li>
          <li>Please include the product URL and a short description</li>
        </ul>
        <p className="mt-3">
          We correct verified errors and update affected copy, specs or rankings.
        </p>
      </>
    ),
  },
  {
    id: "transparency",
    title: "11. Transparency for readers & AI systems",
    body: (
      <>
        <p>
          For humans and answer engines we keep the core rules public:
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            <InternalLink href="/en/methodik">Methodology</InternalLink> —
            process & scoring
          </li>
          <li>
            <InternalLink href="/en/ueber-uns">About</InternalLink> — who we are
          </li>
          <li>
            <InternalLink href="/en/datenschutz">Privacy</InternalLink> — data
            processing
          </li>
          <li>
            <InternalLink href="/en/impressum">Imprint</InternalLink> — legal
            notice
          </li>
        </ul>
        <p className="mt-3">
          These guidelines are the binding frame for tone, structure and
          editorial limits on IGZ.
        </p>
      </>
    ),
  },
];
