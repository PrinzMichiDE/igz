import type { ProductManualLink } from "@/lib/product-manuals/types";

type BrandPortal = {
  keys: string[];
  label: { de: string; en: string };
  buildUrl: (query: string, locale: "de" | "en") => string;
};

const BRAND_PORTALS: BrandPortal[] = [
  {
    keys: ["samsung"],
    label: { de: "Samsung Support – Handbücher", en: "Samsung Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.samsung.com/de/search/?searchvalue=${encodeURIComponent(query)}`
        : `https://www.samsung.com/us/search/?searchvalue=${encodeURIComponent(query)}`,
  },
  {
    keys: ["apple"],
    label: { de: "Apple Support – Handbücher", en: "Apple Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://support.apple.com/de-de/manuals?q=${encodeURIComponent(query)}`
        : `https://support.apple.com/manuals?q=${encodeURIComponent(query)}`,
  },
  {
    keys: ["sony"],
    label: { de: "Sony Support – Hilfedokumente", en: "Sony Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.sony.de/electronics/support/search?query=${encodeURIComponent(query)}`
        : `https://www.sony.com/electronics/support/search?query=${encodeURIComponent(query)}`,
  },
  {
    keys: ["bosch", "siemens"],
    label: {
      de: "BSH Support – Bedienungsanleitungen",
      en: "BSH Support – Instruction manuals",
    },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.bosch-home.de/de/search?search=${encodeURIComponent(query)}`
        : `https://www.bosch-home.com/us/search?search=${encodeURIComponent(query)}`,
  },
  {
    keys: ["dyson"],
    label: { de: "Dyson Support – Anleitungen", en: "Dyson Support – Guides" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.dyson.de/support/search?query=${encodeURIComponent(query)}`
        : `https://www.dyson.com/support/search?query=${encodeURIComponent(query)}`,
  },
  {
    keys: ["philips"],
    label: { de: "Philips Support – Handbücher", en: "Philips Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.philips.de/c-w/support-home/support-landing-page.html#q=${encodeURIComponent(query)}`
        : `https://www.philips.com/c-w/support-home/support-landing-page.html#q=${encodeURIComponent(query)}`,
  },
  {
    keys: ["lg"],
    label: { de: "LG Support – Dokumente", en: "LG Support – Documents" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.lg.com/de/support/search?search=${encodeURIComponent(query)}`
        : `https://www.lg.com/us/support/search?search=${encodeURIComponent(query)}`,
  },
  {
    keys: ["hp", "hewlett packard"],
    label: { de: "HP Support – Handbücher", en: "HP Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://support.hp.com/de-de/search?q=${encodeURIComponent(query)}`
        : `https://support.hp.com/us-en/search?q=${encodeURIComponent(query)}`,
  },
  {
    keys: ["lenovo"],
    label: { de: "Lenovo Support – Handbücher", en: "Lenovo Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://support.lenovo.com/de/de/search?query=${encodeURIComponent(query)}`
        : `https://support.lenovo.com/us/en/search?query=${encodeURIComponent(query)}`,
  },
  {
    keys: ["asus"],
    label: { de: "ASUS Support – Handbücher", en: "ASUS Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.asus.com/de/search/?q=${encodeURIComponent(query)}`
        : `https://www.asus.com/us/search/?q=${encodeURIComponent(query)}`,
  },
  {
    keys: ["anker"],
    label: { de: "Anker Support – Handbücher", en: "Anker Support – Manuals" },
    buildUrl: (query) =>
      `https://support.anker.com/s/?language=de&q=${encodeURIComponent(query)}`,
  },
  {
    keys: ["jbl", "harman"],
    label: { de: "JBL Support – Handbücher", en: "JBL Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://de.jbl.com/search?q=${encodeURIComponent(query)}`
        : `https://www.jbl.com/search?q=${encodeURIComponent(query)}`,
  },
  {
    keys: ["braun"],
    label: { de: "Braun Support – Anleitungen", en: "Braun Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.braun.de/de-de/search?q=${encodeURIComponent(query)}`
        : `https://www.braun.com/en-us/search?q=${encodeURIComponent(query)}`,
  },
  {
    keys: ["miele"],
    label: { de: "Miele Support – Bedienungsanleitungen", en: "Miele Support – Manuals" },
    buildUrl: (query, locale) =>
      locale === "de"
        ? `https://www.miele.de/de/search?query=${encodeURIComponent(query)}`
        : `https://www.mieleusa.com/search?query=${encodeURIComponent(query)}`,
  },
  {
    keys: ["xiaomi", "redmi"],
    label: { de: "Xiaomi Support – Handbücher", en: "Xiaomi Support – Manuals" },
    buildUrl: (query) =>
      `https://www.mi.com/global/search?keyword=${encodeURIComponent(query)}`,
  },
];

function matchesBrand(brand: string, keys: string[]) {
  return keys.some(
    (key) => brand === key || brand.includes(key) || key.includes(brand),
  );
}

export function buildManufacturerPortalLinks(
  brand: string | null,
  modelQuery: string,
  locale: "de" | "en",
): ProductManualLink[] {
  if (!brand) return [];

  const portal = BRAND_PORTALS.find((entry) => matchesBrand(brand, entry.keys));
  if (!portal) return [];

  return [
    {
      title: portal.label[locale],
      url: portal.buildUrl(modelQuery, locale),
      source: "support_portal",
      language: locale,
    },
  ];
}

export function buildGenericManualSearchLinks(
  title: string,
  locale: "de" | "en",
): ProductManualLink[] {
  const query = `${title} ${locale === "de" ? "Bedienungsanleitung PDF" : "user manual PDF official"}`;

  return [
    {
      title:
        locale === "de"
          ? "Hersteller-Handbuch suchen (Google)"
          : "Search manufacturer manual (Google)",
      url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      source: "support_portal",
      language: locale,
    },
  ];
}
