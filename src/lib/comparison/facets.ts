import { detectProductBrand } from "@/lib/product-manuals/extract";
import { parseStoredDatasheet } from "@/lib/product-tech/parse";

export type SpecFacetDefinition = {
  key: string;
  label: string;
  values: string[];
};

export type FacetableProduct = {
  id: string;
  title: string;
  rating?: number | null;
  specsJson?: unknown;
  rawSearchJson?: unknown;
  rawDetailsJson?: unknown;
};

export function resolveProductBrand(product: FacetableProduct): string | null {
  const datasheet = parseStoredDatasheet(product.specsJson);
  if (datasheet?.brandHint?.trim()) {
    return datasheet.brandHint.trim();
  }
  return detectProductBrand({
    title: product.title,
    rawSearchJson: product.rawSearchJson,
    rawDetailsJson: product.rawDetailsJson,
  });
}

export function extractProductSpecMap(
  product: FacetableProduct,
  locale: "de" | "en",
): Record<string, string> {
  const datasheet = parseStoredDatasheet(product.specsJson);
  if (!datasheet) return {};
  const map: Record<string, string> = {};
  for (const row of datasheet.rows) {
    const value = [row.value, row.unit].filter(Boolean).join(" ").trim();
    if (!value) continue;
    map[row.key] = value;
  }
  // Keep labels separately via buildSpecFacetDefinitions
  void locale;
  return map;
}

export function extractProductSpecLabels(
  product: FacetableProduct,
  locale: "de" | "en",
): Record<string, string> {
  const datasheet = parseStoredDatasheet(product.specsJson);
  if (!datasheet) return {};
  const labels: Record<string, string> = {};
  for (const row of datasheet.rows) {
    labels[row.key] = locale === "en" ? row.labelEn : row.labelDe;
  }
  return labels;
}

/**
 * Build adaptive facets: only keys that appear on ≥2 products with ≥2 distinct values.
 */
export function buildSpecFacetDefinitions(
  products: FacetableProduct[],
  locale: "de" | "en",
  limit = 6,
): SpecFacetDefinition[] {
  const valueSets = new Map<string, Set<string>>();
  const labels = new Map<string, string>();

  for (const product of products) {
    const specs = extractProductSpecMap(product, locale);
    const productLabels = extractProductSpecLabels(product, locale);
    for (const [key, value] of Object.entries(specs)) {
      if (!valueSets.has(key)) valueSets.set(key, new Set());
      valueSets.get(key)!.add(value);
      if (!labels.has(key) && productLabels[key]) {
        labels.set(key, productLabels[key]);
      }
    }
  }

  return [...valueSets.entries()]
    .filter(([, values]) => values.size >= 2)
    .map(([key, values]) => ({
      key,
      label: labels.get(key) || key,
      values: [...values].sort((a, b) => a.localeCompare(b, locale)),
    }))
    .sort((a, b) => b.values.length - a.values.length)
    .slice(0, limit);
}

export function collectBrands(products: FacetableProduct[]): string[] {
  const brands = new Set<string>();
  for (const product of products) {
    const brand = resolveProductBrand(product);
    if (brand) brands.add(brand);
  }
  return [...brands].sort((a, b) => a.localeCompare(b, "de"));
}
