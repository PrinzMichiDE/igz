import type { AmazonProductDetails, AmazonSearchProduct } from "@/lib/amazon/rapidapi";
import type { ProductManualLink } from "@/lib/product-manuals/types";

const MANUAL_URL_PATTERN =
  /https?:\/\/[^\s"'<>)\]]+\.(pdf|html?)(?:[^\s"'<>)\]]*)?/gi;

const MANUAL_KEYWORDS =
  /manual|handbuch|anleitung|bedienungsanleitung|user.?guide|instruction|quick.?start|benutzerhandbuch|guide d'utilisation/i;

const MANUAL_FIELD_KEYS =
  /manual|handbuch|anleitung|document|download|support|guide|instructions/i;

function normalizeBrand(value: string) {
  return value
    .toLowerCase()
    .replace(/^visit the\s+/i, "")
    .replace(/\s+store$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function detectProductBrand(input: {
  title: string;
  rawSearchJson?: unknown;
  rawDetailsJson?: unknown;
}): string | null {
  const search = input.rawSearchJson as AmazonSearchProduct | null;
  if (search?.product_byline) {
    const brand = normalizeBrand(search.product_byline);
    if (brand) return brand;
  }

  const details = input.rawDetailsJson as AmazonProductDetails | null;
  const info = details?.product_information ?? details?.product_details ?? {};

  for (const [key, value] of Object.entries(info)) {
    if (/brand|marke|hersteller|manufacturer/i.test(key) && value.trim()) {
      return normalizeBrand(value);
    }
  }

  const titleBrand = input.title.split(/[\s,-]+/)[0];
  return titleBrand ? normalizeBrand(titleBrand) : null;
}

function collectRecordValues(value: unknown, output: string[] = []) {
  if (typeof value === "string") {
    output.push(value);
    return output;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectRecordValues(item, output);
    return output;
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      output.push(key);
      collectRecordValues(nested, output);
    }
  }

  return output;
}

function titleFromUrl(url: string, locale: "de" | "en") {
  if (/\.pdf($|\?)/i.test(url)) {
    return locale === "de" ? "Offizielle PDF-Anleitung" : "Official PDF manual";
  }
  return locale === "de" ? "Offizielle Produktanleitung" : "Official product manual";
}

function isOfficialManualUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;

    const haystack = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
    return (
      MANUAL_KEYWORDS.test(haystack) ||
      /\.pdf($|\?)/i.test(parsed.pathname) ||
      /\/(manual|manuals|support|downloads|anleitung|handbuch|documents)\//i.test(
        parsed.pathname,
      )
    );
  } catch {
    return false;
  }
}

export function extractManualLinksFromAmazonData(
  input: {
    rawSearchJson?: unknown;
    rawDetailsJson?: unknown;
    productUrl?: string | null;
  },
  locale: "de" | "en",
): ProductManualLink[] {
  const details = input.rawDetailsJson as AmazonProductDetails | null;
  const links = new Map<string, ProductManualLink>();

  const values = collectRecordValues({
    search: input.rawSearchJson,
    details: input.rawDetailsJson,
  });

  for (const value of values) {
    const matches = value.match(MANUAL_URL_PATTERN) ?? [];
    for (const rawUrl of matches) {
      const url = rawUrl.replace(/[),.;]+$/, "");
      if (!isOfficialManualUrl(url)) continue;

      links.set(url, {
        title: titleFromUrl(url, locale),
        url,
        source: "amazon",
        language: locale,
      });
    }

    if (MANUAL_FIELD_KEYS.test(value) && value.includes("http")) {
      const embedded = value.match(/https?:\/\/[^\s"'<>)\]]+/gi) ?? [];
      for (const rawUrl of embedded) {
        const url = rawUrl.replace(/[),.;]+$/, "");
        if (!isOfficialManualUrl(url)) continue;
        links.set(url, {
          title: value.slice(0, 80),
          url,
          source: "amazon",
          language: locale,
        });
      }
    }
  }

  if (input.productUrl) {
    const amazonManualUrl = `${input.productUrl.split("?")[0]}#productDetails`;
    links.set(amazonManualUrl, {
      title:
        locale === "de"
          ? "Produktdetails & Dokumente auf Amazon"
          : "Product details & documents on Amazon",
      url: amazonManualUrl,
      source: "amazon",
      language: locale,
    });
  }

  if (details?.product_url && details.product_url !== input.productUrl) {
    const url = `${details.product_url.split("?")[0]}#productDetails`;
    links.set(url, {
      title:
        locale === "de"
          ? "Amazon-Produktseite (Dokumente)"
          : "Amazon product page (documents)",
      url,
      source: "amazon",
      language: locale,
    });
  }

  return [...links.values()];
}

export function buildModelQuery(title: string, brand: string | null) {
  const cleaned = title
    .replace(new RegExp(brand ?? "", "i"), "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || title;
}
