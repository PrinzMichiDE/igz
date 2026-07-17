export type NicheFaq = { question: string; answer: string };

export type NicheRankingPage = {
  id: string;
  slug: string;
  kind: "pillar" | "cluster" | "guide";
  /** Path without locale, e.g. /kategorie/... or /ratgeber/... */
  path: string;
  priority: number;
  primaryKeywordDe: string;
  primaryKeywordEn: string;
  secondaryKeywordsDe: string[];
  secondaryKeywordsEn: string[];
  searchIntent: "commercial" | "informational" | "comparison";
  titleDe: string;
  titleEn: string;
  h1De: string;
  h1En: string;
  descriptionDe: string;
  descriptionEn: string;
  directAnswerDe: string;
  directAnswerEn: string;
  keyTakeawaysDe: string[];
  keyTakeawaysEn: string[];
  faqDe: NicheFaq[];
  faqEn: NicheFaq[];
  audienceDe: string;
  audienceEn: string;
  ctaLabelDe: string;
  ctaLabelEn: string;
};

/**
 * Focus niche: Bluetooth headphones (DE primary, EN secondary).
 * First 10 ranking pages to dominate before expanding to other categories.
 */
export const BLUETOOTH_HEADPHONES_PAGES: NicheRankingPage[] = [
  {
    id: "p01-pillar",
    slug: "bluetooth-kopfhoerer",
    kind: "pillar",
    path: "/kategorie/bluetooth-kopfhoerer",
    priority: 1,
    primaryKeywordDe: "beste bluetooth kopfhörer test",
    primaryKeywordEn: "best bluetooth headphones",
    secondaryKeywordsDe: [
      "bluetooth kopfhörer vergleich",
      "bluetooth kopfhörer testsieger",
      "wireless kopfhörer test",
    ],
    secondaryKeywordsEn: [
      "bluetooth headphones comparison",
      "best wireless headphones",
      "bluetooth headphones review",
    ],
    searchIntent: "comparison",
    titleDe: "Beste Bluetooth-Kopfhörer Test & Vergleich 2026",
    titleEn: "Best Bluetooth Headphones Test & Comparison 2026",
    h1De: "Beste Bluetooth-Kopfhörer im Test & Vergleich",
    h1En: "Best Bluetooth Headphones: Test & Comparison",
    descriptionDe:
      "Bluetooth-Kopfhörer Vergleich 2026: Testsieger, Preis-Leistungs-Tipp und Budget-Empfehlung mit klaren Scores und Kaufberatung.",
    descriptionEn:
      "Bluetooth headphones comparison 2026: overall winner, best value and budget pick with clear scores and buying advice.",
    directAnswerDe:
      "Die besten Bluetooth-Kopfhörer 2026 überzeugen mit starkem Alltagsklang, solide ANC oder Passform und gutem Preis-Leistungs-Verhältnis – je nach Nutzung als Over-Ear, In-Ear oder Sportmodell.",
    directAnswerEn:
      "The best Bluetooth headphones in 2026 deliver solid everyday sound, useful ANC or fit, and strong value — depending on whether you need over-ear, in-ear or sport models.",
    keyTakeawaysDe: [
      "Zuerst Nutzungsszenario wählen: Pendeln, Sport, Büro oder HiFi-alltag",
      "ANC lohnt sich vor allem in Bahn, Flugzeug und Großstadtlärm",
      "Akku und Tragekomfort sind im Alltag oft wichtiger als Maximalbass",
      "Preis-Leistung schlägt Markenprestige bei den meisten Käufern",
    ],
    keyTakeawaysEn: [
      "Pick the use case first: commute, sport, office or casual listening",
      "ANC is most valuable on trains, flights and city noise",
      "Battery and comfort often matter more than extreme bass",
      "Value usually beats brand prestige for most buyers",
    ],
    faqDe: [
      {
        question: "Welcher Bluetooth-Kopfhörer ist der Testsieger?",
        answer:
          "Der Testsieger ist das Modell mit dem besten Gesamtscore aus Klang, Komfort, Ausstattung und Preis in unserem aktuellen Vergleich.",
      },
      {
        question: "Sind teure Marken immer besser?",
        answer:
          "Nein. In der Mittelklasse liegen viele Modelle dicht beieinander – entscheidend sind Passform, Akku und dein Nutzungsszenario.",
      },
    ],
    faqEn: [
      {
        question: "Which Bluetooth headphones win overall?",
        answer:
          "The winner is the model with the best overall score across sound, comfort, features and price in our current comparison.",
      },
      {
        question: "Are expensive brands always better?",
        answer:
          "No. Mid-range options are often close — fit, battery and your use case matter more than brand prestige.",
      },
    ],
    audienceDe: "Alle, die einen klaren Gesamtsieger und Alternativen suchen",
    audienceEn: "Anyone looking for a clear overall winner and alternatives",
    ctaLabelDe: "Zum Bluetooth-Kopfhörer Vergleich",
    ctaLabelEn: "Open Bluetooth headphones comparison",
  },
  {
    id: "p02-anc",
    slug: "bluetooth-kopfhoerer-mit-noise-cancelling",
    kind: "cluster",
    path: "/ratgeber/bluetooth-kopfhoerer-mit-noise-cancelling",
    priority: 2,
    primaryKeywordDe: "bluetooth kopfhörer mit noise cancelling",
    primaryKeywordEn: "bluetooth headphones with noise cancelling",
    secondaryKeywordsDe: ["anc kopfhörer test", "noise cancelling kopfhörer vergleich"],
    secondaryKeywordsEn: ["anc headphones comparison", "best noise cancelling earbuds"],
    searchIntent: "commercial",
    titleDe: "Bluetooth-Kopfhörer mit Noise Cancelling: Test 2026",
    titleEn: "Bluetooth Headphones with Noise Cancelling: 2026 Guide",
    h1De: "Bluetooth-Kopfhörer mit Noise Cancelling im Vergleich",
    h1En: "Bluetooth Headphones with Noise Cancelling Compared",
    descriptionDe:
      "ANC-Bluetooth-Kopfhörer im Vergleich: Welche Modelle Straßenlärm, Bahn und Büro wirklich dämpfen – inkl. Kaufempfehlung.",
    descriptionEn:
      "ANC Bluetooth headphones compared: which models actually cut street, train and office noise — with clear picks.",
    directAnswerDe:
      "Für starkes Noise Cancelling lohnen sich Over-Ear-Modelle oder hochwertige In-Ears mit gutem Sitz; entscheidend sind Dämmung im Alltag und Komfort über Stunden.",
    directAnswerEn:
      "For strong noise cancelling, choose over-ear models or well-fitting premium in-ears; real-world isolation and all-day comfort matter most.",
    keyTakeawaysDe: [
      "ANC hilft am meisten bei gleichmäßigem Tief-/Mittel-Lärm",
      "Schlechter Sitz = schwaches ANC, egal welche Marketingwerte",
      "Transparenzmodus ist im Straßenverkehr wichtig",
    ],
    keyTakeawaysEn: [
      "ANC works best on steady low/mid noise",
      "Poor fit kills ANC performance regardless of claims",
      "Transparency mode matters in traffic",
    ],
    faqDe: [
      {
        question: "Brauche ich unbedingt ANC?",
        answer:
          "Für Pendeln und Reisen meist ja. Im stillen Homeoffice ist guter Klang und Tragekomfort oft wichtiger.",
      },
    ],
    faqEn: [
      {
        question: "Do I really need ANC?",
        answer:
          "For commuting and travel, usually yes. In a quiet home office, comfort and sound often matter more.",
      },
    ],
    audienceDe: "Pendler, Vielflieger, Open-Space-Arbeiter",
    audienceEn: "Commuters, frequent flyers, open-office workers",
    ctaLabelDe: "ANC-Modelle vergleichen",
    ctaLabelEn: "Compare ANC models",
  },
  {
    id: "p03-inear",
    slug: "bluetooth-in-ear-kopfhoerer",
    kind: "cluster",
    path: "/ratgeber/bluetooth-in-ear-kopfhoerer",
    priority: 3,
    primaryKeywordDe: "beste bluetooth in ear kopfhörer",
    primaryKeywordEn: "best bluetooth in ear headphones",
    secondaryKeywordsDe: ["true wireless earbuds test", "in ear bluetooth test"],
    secondaryKeywordsEn: ["best true wireless earbuds", "wireless earbuds comparison"],
    searchIntent: "comparison",
    titleDe: "Beste Bluetooth In-Ear Kopfhörer Test 2026",
    titleEn: "Best Bluetooth In-Ear Headphones 2026",
    h1De: "Beste Bluetooth In-Ear Kopfhörer im Test",
    h1En: "Best Bluetooth In-Ear Headphones Reviewed",
    descriptionDe:
      "True-Wireless In-Ears im Vergleich: Passform, Akku, ANC und Klang für Alltag, Sport und Pendeln.",
    descriptionEn:
      "True-wireless in-ears compared: fit, battery, ANC and sound for daily use, sport and commuting.",
    directAnswerDe:
      "Die besten Bluetooth-In-Ears sitzen sicher, liefern alltagstauglichen Klang und halten mit Case einen Arbeitstag durch – ANC ist ein Plus, aber Passform entscheidet.",
    directAnswerEn:
      "The best Bluetooth in-ears stay secure, sound good for daily use and last a workday with the case — ANC helps, but fit decides everything.",
    keyTakeawaysDe: [
      "Passform und Dichtheit vor Bass-Marketing prüfen",
      "Case-Akku zählt für Reisen und Bürotag",
      "IP-Schutz erst ab Sport/Schweiß wirklich relevant",
    ],
    keyTakeawaysEn: [
      "Prioritize fit and seal over bass marketing",
      "Case battery matters for travel and workdays",
      "IP rating mainly matters for sport/sweat",
    ],
    faqDe: [
      {
        question: "In-Ear oder Over-Ear?",
        answer:
          "In-Ear für unterwegs und Sport, Over-Ear für langen Komfort und oft stärkeres ANC.",
      },
    ],
    faqEn: [
      {
        question: "In-ear or over-ear?",
        answer:
          "In-ear for portability and sport, over-ear for long comfort and often stronger ANC.",
      },
    ],
    audienceDe: "Mobile Nutzer, Minimalisten, Sport-Einsteiger",
    audienceEn: "Mobile users, minimalists, casual athletes",
    ctaLabelDe: "In-Ears vergleichen",
    ctaLabelEn: "Compare in-ears",
  },
  {
    id: "p04-sport",
    slug: "bluetooth-kopfhoerer-sport",
    kind: "cluster",
    path: "/ratgeber/bluetooth-kopfhoerer-sport",
    priority: 4,
    primaryKeywordDe: "bluetooth kopfhörer sport",
    primaryKeywordEn: "best wireless earbuds for running",
    secondaryKeywordsDe: ["sport kopfhörer bluetooth", "kopfhörer joggen test"],
    secondaryKeywordsEn: ["sport bluetooth headphones", "running earbuds"],
    searchIntent: "commercial",
    titleDe: "Bluetooth-Kopfhörer für Sport & Joggen: Test 2026",
    titleEn: "Best Sport Bluetooth Headphones & Running Earbuds 2026",
    h1De: "Bluetooth-Kopfhörer für Sport im Vergleich",
    h1En: "Sport Bluetooth Headphones Compared",
    descriptionDe:
      "Sport-Kopfhörer Test: sicherer Halt, Schweißresistenz und stabiler Sound beim Laufen, Gym und Outdoor.",
    descriptionEn:
      "Sport headphones guide: secure fit, sweat resistance and stable sound for running, gym and outdoors.",
    directAnswerDe:
      "Für Sport zählen Halt und IP-Schutz mehr als HiFi-Feinschliff; Ideal sind leichte In-Ears mit stabilem Sitz und zuverlässiger Verbindung.",
    directAnswerEn:
      "For sport, secure fit and IP protection beat audiophile polish; light in-ears with stable connection win.",
    keyTakeawaysDe: [
      "IPX4+ als Praxisminimum bei Schweiß",
      "Ohrbügel/Wings helfen gegen Verrutschen",
      "Zu starkes ANC im Straßenverkehr eher riskant",
    ],
    keyTakeawaysEn: [
      "IPX4+ is a practical minimum with sweat",
      "Wings/hooks help prevent slip-out",
      "Heavy ANC can be risky in traffic",
    ],
    faqDe: [
      {
        question: "Sind Over-Ears zum Joggen geeignet?",
        answer:
          "Meist nein – sie wippen, werden warm und sind unpraktisch. In-Ears sind die bessere Sportwahl.",
      },
    ],
    faqEn: [
      {
        question: "Are over-ears good for running?",
        answer:
          "Usually no — they bounce, get warm and feel bulky. In-ears are the better sport choice.",
      },
    ],
    audienceDe: "Läufer, Gym, Outdoor-Training",
    audienceEn: "Runners, gym users, outdoor training",
    ctaLabelDe: "Sport-Kopfhörer finden",
    ctaLabelEn: "Find sport headphones",
  },
  {
    id: "p05-budget",
    slug: "guenstige-bluetooth-kopfhoerer",
    kind: "cluster",
    path: "/ratgeber/guenstige-bluetooth-kopfhoerer",
    priority: 5,
    primaryKeywordDe: "günstige bluetooth kopfhörer",
    primaryKeywordEn: "best budget bluetooth headphones",
    secondaryKeywordsDe: ["bluetooth kopfhörer unter 50 euro", "billige earbuds test"],
    secondaryKeywordsEn: ["cheap wireless earbuds", "budget bluetooth headphones"],
    searchIntent: "commercial",
    titleDe: "Günstige Bluetooth-Kopfhörer: Beste Modelle 2026",
    titleEn: "Best Budget Bluetooth Headphones 2026",
    h1De: "Günstige Bluetooth-Kopfhörer mit starker Preis-Leistung",
    h1En: "Best Budget Bluetooth Headphones for the Money",
    descriptionDe:
      "Günstige Bluetooth-Kopfhörer im Vergleich: Welche Budget-Modelle wirklich alltagstauglich sind – ohne teuren Markenaufpreis.",
    descriptionEn:
      "Budget Bluetooth headphones compared: which affordable models are actually good enough for everyday use.",
    directAnswerDe:
      "Gute günstige Bluetooth-Kopfhörer gibt es bereits unter 50–100 €, wenn du bei Passform, stabilem Bluetooth und akzeptablem Akku keine Kompromisse machst.",
    directAnswerEn:
      "Good budget Bluetooth headphones already exist under $50–100 if you prioritize fit, stable Bluetooth and acceptable battery life.",
    keyTakeawaysDe: [
      "Budget-Sieger bei Komfort und Verbindung prüfen, nicht bei Features",
      "Extreme Bass-Claims oft Marketing",
      "Rückgaberecht nutzen und Passform testen",
    ],
    keyTakeawaysEn: [
      "Judge budget picks on comfort and connection, not feature lists",
      "Extreme bass claims are often marketing",
      "Use returns to validate fit",
    ],
    faqDe: [
      {
        question: "Reicht ein Modell unter 50 €?",
        answer:
          "Für Podcasts, Calls und Alltagsmusik oft ja. Für ANC auf Reisen eher in die Mittelklasse gehen.",
      },
    ],
    faqEn: [
      {
        question: "Is under $50 enough?",
        answer:
          "For podcasts, calls and casual music, often yes. For travel ANC, step into mid-range.",
      },
    ],
    audienceDe: "Preisbewusste Einsteiger und Zweitgerät-Käufer",
    audienceEn: "Budget buyers and secondary-device shoppers",
    ctaLabelDe: "Budget-Tipps ansehen",
    ctaLabelEn: "See budget picks",
  },
  {
    id: "p06-iphone",
    slug: "bluetooth-kopfhoerer-fuer-iphone",
    kind: "cluster",
    path: "/ratgeber/bluetooth-kopfhoerer-fuer-iphone",
    priority: 6,
    primaryKeywordDe: "bluetooth kopfhörer für iphone",
    primaryKeywordEn: "best bluetooth headphones for iphone",
    secondaryKeywordsDe: ["kopfhörer iphone ohne lightning", "airpods alternative"],
    secondaryKeywordsEn: ["airpods alternatives", "wireless headphones for iphone"],
    searchIntent: "commercial",
    titleDe: "Bluetooth-Kopfhörer für iPhone: Beste Alternativen 2026",
    titleEn: "Best Bluetooth Headphones for iPhone 2026",
    h1De: "Beste Bluetooth-Kopfhörer für iPhone",
    h1En: "Best Bluetooth Headphones for iPhone",
    descriptionDe:
      "iPhone-Kopfhörer Vergleich: AirPods-Alternativen mit starkem Habit, stabilem Pairing und guter Call-Qualität.",
    descriptionEn:
      "iPhone headphones guide: AirPods alternatives with easy pairing, stable connection and solid call quality.",
    directAnswerDe:
      "Für iPhone zählen einfaches Pairing, stabile Verbindung und gute Mikrofonqualität; AAC-Unterstützung und zuverlässige Multipoint-Nutzung sind praktische Pluspunkte.",
    directAnswerEn:
      "For iPhone, easy pairing, stable connection and mic quality matter most; AAC support and reliable multipoint are practical bonuses.",
    keyTakeawaysDe: [
      "Nicht nur 'Apple kompatibel' – reale Call-Qualität prüfen",
      "Case-Größe für Hosentasche relevant",
      "Spatial Audio ist nice-to-have, kein Muss",
    ],
    keyTakeawaysEn: [
      "Don't stop at 'Apple compatible' — test call quality",
      "Case size matters for pockets",
      "Spatial audio is optional, not required",
    ],
    faqDe: [
      {
        question: "Brauche ich zwingend AirPods?",
        answer:
          "Nein. Viele Bluetooth-Modelle funktionieren am iPhone hervorragend und sind oft günstiger.",
      },
    ],
    faqEn: [
      {
        question: "Do I need AirPods?",
        answer:
          "No. Many Bluetooth models work great with iPhone and often cost less.",
      },
    ],
    audienceDe: "iPhone-Nutzer, die Alternativen zu AirPods suchen",
    audienceEn: "iPhone users looking for AirPods alternatives",
    ctaLabelDe: "iPhone-Empfehlungen öffnen",
    ctaLabelEn: "Open iPhone picks",
  },
  {
    id: "p07-office",
    slug: "bluetooth-kopfhoerer-buero-homeoffice",
    kind: "cluster",
    path: "/ratgeber/bluetooth-kopfhoerer-buero-homeoffice",
    priority: 7,
    primaryKeywordDe: "bluetooth kopfhörer homeoffice",
    primaryKeywordEn: "best bluetooth headphones for office",
    secondaryKeywordsDe: ["kopfhörer für zoom calls", "headset bluetooth büro"],
    secondaryKeywordsEn: ["headphones for zoom calls", "bluetooth headset office"],
    searchIntent: "commercial",
    titleDe: "Bluetooth-Kopfhörer für Büro & Homeoffice 2026",
    titleEn: "Best Bluetooth Headphones for Office & Remote Work 2026",
    h1De: "Bluetooth-Kopfhörer für Büro und Homeoffice",
    h1En: "Bluetooth Headphones for Office & Remote Work",
    descriptionDe:
      "Büro-Kopfhörer Vergleich: klare Calls, langer Tragekomfort und sinnvolle ANC-Stufe für Homeoffice und Open Space.",
    descriptionEn:
      "Office headphones guide: clear calls, all-day comfort and sensible ANC for remote work and open offices.",
    directAnswerDe:
      "Im Büro/Homeoffice gewinnen Modelle mit klarer Sprache, angenehmem Langzeitkomfort und optional leichtem ANC – Gaming-Bass ist Nebensache.",
    directAnswerEn:
      "For office/remote work, clear voice, all-day comfort and light ANC win — gaming bass is secondary.",
    keyTakeawaysDe: [
      "Mikrofonqualität entscheidet bei Calls",
      "Leichtbau verhindert Druckstellen",
      "Multipoint für Laptop + Handy spart Umschalten",
    ],
    keyTakeawaysEn: [
      "Mic quality decides call usefulness",
      "Lightweight builds prevent hotspots",
      "Multipoint for laptop + phone reduces switching",
    ],
    faqDe: [
      {
        question: "Headset oder normale Kopfhörer?",
        answer:
          "Wenn Calls Priorität haben, auf Modelle mit starker Sprachübertragung achten – nicht nur Musikklang.",
      },
    ],
    faqEn: [
      {
        question: "Headset or regular headphones?",
        answer:
          "If calls matter, prioritize strong voice pickup — not just music tuning.",
      },
    ],
    audienceDe: "Homeoffice, Meetings, Open Space",
    audienceEn: "Remote workers, meetings, open offices",
    ctaLabelDe: "Büro-Empfehlungen ansehen",
    ctaLabelEn: "See office picks",
  },
  {
    id: "p08-battery",
    slug: "bluetooth-kopfhoerer-akku-vergleich",
    kind: "cluster",
    path: "/ratgeber/bluetooth-kopfhoerer-akku-vergleich",
    priority: 8,
    primaryKeywordDe: "bluetooth kopfhörer akku vergleich",
    primaryKeywordEn: "bluetooth headphones battery life comparison",
    secondaryKeywordsDe: ["kopfhörer lange akkulaufzeit", "earbuds akku test"],
    secondaryKeywordsEn: ["longest battery wireless headphones", "earbuds battery test"],
    searchIntent: "comparison",
    titleDe: "Bluetooth-Kopfhörer mit langem Akku: Vergleich 2026",
    titleEn: "Longest Battery Bluetooth Headphones Comparison 2026",
    h1De: "Bluetooth-Kopfhörer Akkulaufzeit im Vergleich",
    h1En: "Bluetooth Headphones Battery Life Compared",
    descriptionDe:
      "Welche Bluetooth-Kopfhörer halten einen langen Tag durch? Akku-Vergleich inkl. Praxis-Tipps zu ANC und Lautstärke.",
    descriptionEn:
      "Which Bluetooth headphones last all day? Battery comparison with practical notes on ANC and volume.",
    directAnswerDe:
      "Lange Akkulaufzeit erreichst du vor allem mit Over-Ears oder effizienten In-Ears; ANC und hohe Lautstärke verkürzen die Laufzeit spürbar.",
    directAnswerEn:
      "Long battery life comes mostly from efficient over-ears or in-ears; ANC and high volume noticeably reduce runtime.",
    keyTakeawaysDe: [
      "Herstellerangaben oft bei mittlerer Lautstärke ohne ANC",
      "Schnellladen ist im Alltag ein echter Vorteil",
      "Case-Reserve bei In-Ears einrechnen",
    ],
    keyTakeawaysEn: [
      "Manufacturer claims often exclude ANC and high volume",
      "Fast charging is a real daily advantage",
      "Count in-ear case reserves too",
    ],
    faqDe: [
      {
        question: "Wie viel Akku brauche ich wirklich?",
        answer:
          "Für Pendeln reichen oft 8–12 Stunden. Für Reisen und lange Sessions sind 20+ Stunden oder ein starkes Case ideal.",
      },
    ],
    faqEn: [
      {
        question: "How much battery do I need?",
        answer:
          "Commuting often needs 8–12 hours. For travel and long sessions, 20+ hours or a strong case is ideal.",
      },
    ],
    audienceDe: "Vielnutzer, Reisende, lange Sessions",
    audienceEn: "Heavy users, travelers, long sessions",
    ctaLabelDe: "Akku-Tipps vergleichen",
    ctaLabelEn: "Compare battery picks",
  },
  {
    id: "p09-overear",
    slug: "over-ear-bluetooth-kopfhoerer",
    kind: "cluster",
    path: "/ratgeber/over-ear-bluetooth-kopfhoerer",
    priority: 9,
    primaryKeywordDe: "over ear bluetooth kopfhörer test",
    primaryKeywordEn: "best over ear bluetooth headphones",
    secondaryKeywordsDe: ["bluetooth kopfhörer ohrumschließend", "over ear wireless test"],
    secondaryKeywordsEn: ["wireless over ear headphones", "best over ear anc"],
    searchIntent: "comparison",
    titleDe: "Over-Ear Bluetooth-Kopfhörer Test & Vergleich 2026",
    titleEn: "Best Over-Ear Bluetooth Headphones 2026",
    h1De: "Over-Ear Bluetooth-Kopfhörer im Test",
    h1En: "Over-Ear Bluetooth Headphones Reviewed",
    descriptionDe:
      "Over-Ear Bluetooth-Kopfhörer Vergleich: Komfort, ANC, Klangbühne und Akkulaufzeit für lange Hörsessions.",
    descriptionEn:
      "Over-ear Bluetooth headphones compared: comfort, ANC, soundstage and battery for long listening sessions.",
    directAnswerDe:
      "Over-Ears sind ideal für langen Tragekomfort und oft stärkeres ANC; sie sind weniger kompakt als In-Ears, dafür entspannter über Stunden.",
    directAnswerEn:
      "Over-ears are ideal for long comfort and often stronger ANC; less portable than in-ears, but easier for hours of wear.",
    keyTakeawaysDe: [
      "Polsterung und Anpressdruck entscheiden über Stundenkomfort",
      "Klappbarkeit/Transportcase für Pendler relevant",
      "Wärmeentwicklung im Sommer beachten",
    ],
    keyTakeawaysEn: [
      "Padding and clamp force decide multi-hour comfort",
      "Foldability/case matters for commuting",
      "Watch heat build-up in summer",
    ],
    faqDe: [
      {
        question: "Für wen sind Over-Ears besser?",
        answer:
          "Für Homeoffice, Flüge und lange Musiksessions – nicht für intensives Jogging.",
      },
    ],
    faqEn: [
      {
        question: "Who should choose over-ears?",
        answer:
          "Remote work, flights and long listening sessions — not intense running.",
      },
    ],
    audienceDe: "Komfort-Suchende, Vielflieger, Musikhörer",
    audienceEn: "Comfort seekers, frequent flyers, music listeners",
    ctaLabelDe: "Over-Ears vergleichen",
    ctaLabelEn: "Compare over-ears",
  },
  {
    id: "p10-guide",
    slug: "bluetooth-kopfhoerer-kaufberatung",
    kind: "guide",
    path: "/ratgeber/bluetooth-kopfhoerer-kaufberatung",
    priority: 10,
    primaryKeywordDe: "bluetooth kopfhörer kaufberatung",
    primaryKeywordEn: "bluetooth headphones buying guide",
    secondaryKeywordsDe: ["worauf achten bluetooth kopfhörer", "kopfhörer kaufen tipps"],
    secondaryKeywordsEn: ["what to look for in wireless headphones", "headphones buying tips"],
    searchIntent: "informational",
    titleDe: "Bluetooth-Kopfhörer Kaufberatung: Worauf achten? 2026",
    titleEn: "Bluetooth Headphones Buying Guide 2026",
    h1De: "Bluetooth-Kopfhörer Kaufberatung: Worauf du achten solltest",
    h1En: "Bluetooth Headphones Buying Guide: What Matters",
    descriptionDe:
      "Kaufberatung Bluetooth-Kopfhörer: Passform, ANC, Akku, Codecs und typische Kauffehler – bevor du bestellst.",
    descriptionEn:
      "Bluetooth headphones buying guide: fit, ANC, battery, codecs and common mistakes before you buy.",
    directAnswerDe:
      "Vor dem Kauf zuerst den Einsatzzweck klären, dann Passform/Komfort und Akku prüfen; Features wie ANC oder Multipoint erst danach priorisieren.",
    directAnswerEn:
      "Before buying, define the use case first, then validate fit/comfort and battery; prioritize ANC or multipoint only after that.",
    keyTakeawaysDe: [
      "Einsatzzweck > Feature-Liste",
      "Passform entscheidet über Klang und ANC",
      "Rückgabefrist aktiv zum Praxistest nutzen",
      "Affiliate hinweise ändern nicht die Testkriterien",
    ],
    keyTakeawaysEn: [
      "Use case beats feature lists",
      "Fit decides sound and ANC",
      "Use return windows for real-world testing",
      "Affiliate links do not change scoring criteria",
    ],
    faqDe: [
      {
        question: "Welcher Fehler ist am häufigsten?",
        answer:
          "Kopfhörer nur nach Marke oder Bass-Versprechen zu kaufen, ohne Passform und Nutzungsszenario zu prüfen.",
      },
      {
        question: "Welche 3 Specs reichen zur Vorauswahl?",
        answer:
          "Tragekomfort/Passform, Akkulaufzeit und – je nach Bedarf – ANC oder Mikrofonqualität.",
      },
    ],
    faqEn: [
      {
        question: "What’s the most common mistake?",
        answer:
          "Buying on brand or bass promises without checking fit and use case.",
      },
      {
        question: "Which 3 specs matter most for shortlisting?",
        answer:
          "Comfort/fit, battery life, and — depending on need — ANC or microphone quality.",
      },
    ],
    audienceDe: "Einsteiger vor der Kaufentscheidung",
    audienceEn: "Beginners before purchase",
    ctaLabelDe: "Zur Kaufberatung",
    ctaLabelEn: "Open buying guide",
  },
];

export function getNichePageBySlug(slug: string) {
  return BLUETOOTH_HEADPHONES_PAGES.find((page) => page.slug === slug);
}

export function getClusterPages() {
  return BLUETOOTH_HEADPHONES_PAGES.filter((page) => page.kind !== "pillar");
}

export function getPillarPage() {
  return BLUETOOTH_HEADPHONES_PAGES.find((page) => page.kind === "pillar")!;
}

export const NICHE_CATEGORY_SLUG = "bluetooth-kopfhoerer";

export const NICHE_CATEGORY_KEYWORDS_DE = [
  "bluetooth kopfhörer",
  "beste bluetooth kopfhörer test",
  "bluetooth kopfhörer vergleich",
  "wireless headphones",
  "bluetooth kopfhörer mit noise cancelling",
];
