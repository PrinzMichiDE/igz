/**
 * Generates deterministic gradient SVG covers for all curated categories.
 * Output: public/categories/<slug>.svg
 *
 * Parses slug/nameDe from top-categories.ts (no TS runtime import needed).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "categories");
const sourcePath = join(root, "src", "lib", "amazon", "top-categories.ts");

const PALETTES = [
  ["#0F4C81", "#1F7A8C"],
  ["#1B4332", "#2D6A4F"],
  ["#5C2C6D", "#7B2CBF"],
  ["#9A3412", "#EA580C"],
  ["#1E3A5F", "#2563EB"],
  ["#334155", "#0EA5E9"],
  ["#3F2E3E", "#BE185D"],
  ["#14532D", "#16A34A"],
  ["#422006", "#D97706"],
  ["#0C4A6E", "#0284C7"],
];

const ICONS = {
  elektronik: "⚡",
  "computer-zubehoer": "💻",
  "heimkino-tv": "📺",
  smartphones: "📱",
  "kopfhoerer-audio": "🎧",
  "bluetooth-kopfhoerer": "🎧",
  "haushalt-kueche": "🍳",
  staubsauger: "🧹",
  "akku-staubsauger": "🧹",
  kaffeemaschinen: "☕",
  heimwerker: "🔧",
  garten: "🌿",
  "sport-outdoor": "🏃",
  fitness: "🏋️",
  mode: "👕",
  schuhe: "👟",
  uhren: "⌚",
  schoenheit: "💄",
  drogerie: "🧴",
  baby: "👶",
  spielzeug: "🧸",
  "auto-motorrad": "🚗",
  haustier: "🐾",
  buero: "🖇️",
  beleuchtung: "💡",
  moebel: "🛋️",
  heimtextilien: "🛏️",
  "koffer-reisen": "🧳",
  kameras: "📷",
  gaming: "🎮",
  videospiele: "🕹️",
  filme: "🎬",
  serien: "📺",
  musikinstrumente: "🎸",
  "industrie-wissenschaft": "🧪",
  grossgeraete: "🧺",
  "klima-heizung": "❄️",
  "smart-home": "🏠",
  "tablets-ebooks": "📱",
  "drucker-scanner": "🖨️",
  monitore: "🖥️",
  netzwerk: "📶",
  speichermedien: "💾",
  "pc-peripherie": "⌨️",
  powerbanks: "🔋",
  wearables: "⌚",
  "grill-outdoor-kueche": "🔥",
  camping: "⛺",
  fahrrad: "🚲",
  schmuck: "💍",
  "rucksacke-taschen": "🎒",
  reinigung: "🧽",
  luftreiniger: "🌬️",
  "wassersieder-kochfelder": "🍲",
  kindermode: "🧒",
};

function hashSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildSvg(slug, title) {
  const [c1, c2] = PALETTES[hashSlug(slug) % PALETTES.length];
  const icon = ICONS[slug] || "✦";
  const label = title.length > 22 ? `${title.slice(0, 20)}…` : title;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="640" height="480" rx="36" fill="url(#g)"/>
  <circle cx="520" cy="70" r="90" fill="#ffffff" opacity="0.10"/>
  <circle cx="80" cy="420" r="120" fill="#ffffff" opacity="0.08"/>
  <text x="320" y="210" text-anchor="middle" font-size="92" filter="url(#soft)">${icon}</text>
  <text x="320" y="300" text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700">${escapeXml(label)}</text>
  <text x="320" y="340" text-anchor="middle" fill="#ffffff" opacity="0.85" font-family="system-ui, -apple-system, sans-serif" font-size="16">IGZ Vergleich</text>
</svg>
`;
}

function parseTopCategories(source) {
  const items = [];
  const blockRe =
    /\{\s*slug:\s*"([^"]+)"[\s\S]*?nameDe:\s*"((?:\\.|[^"\\])*)"/g;
  let match;
  while ((match = blockRe.exec(source))) {
    items.push({
      slug: match[1],
      nameDe: match[2].replace(/\\"/g, '"'),
    });
  }
  return items;
}

function main() {
  mkdirSync(outDir, { recursive: true });

  const source = readFileSync(sourcePath, "utf8");
  const parsed = parseTopCategories(source);
  if (parsed.length < 40) {
    throw new Error(
      `Expected many categories from ${sourcePath}, got ${parsed.length}`,
    );
  }

  const extras = [
    { slug: "bluetooth-kopfhoerer", nameDe: "Bluetooth-Kopfhörer" },
    { slug: "akku-staubsauger", nameDe: "Akku-Staubsauger" },
    { slug: "default", nameDe: "Kategorie" },
  ];

  const bySlug = new Map();
  for (const item of [...parsed, ...extras]) {
    bySlug.set(item.slug, item);
  }

  let written = 0;
  for (const item of bySlug.values()) {
    writeFileSync(join(outDir, `${item.slug}.svg`), buildSvg(item.slug, item.nameDe), "utf8");
    written += 1;
  }

  console.log(`Wrote ${written} category SVGs to public/categories`);
}

main();
