import {
  parseStoredDatasheet,
  datasheetToFeatureList,
} from "@/lib/product-tech/parse";
import type { SpecRow } from "@/lib/product-tech/types";

export type SpecMatrixProduct = {
  id: string;
  title: string;
  specsJson?: unknown;
  features?: unknown;
  ctaHref?: string;
};

export type SpecMatrixColumn = {
  key: string;
  label: string;
  group?: string | null;
};

export type SpecMatrixRow = {
  id: string;
  title: string;
  ctaHref?: string;
  values: Array<string | null>;
};

function rowsFromProduct(product: SpecMatrixProduct): SpecRow[] {
  const datasheet = parseStoredDatasheet(product.specsJson);
  if (datasheet?.rows?.length) return datasheet.rows;

  // Fallback: parse "Label: Value" feature strings into ad-hoc rows
  const features = Array.isArray(product.features)
    ? (product.features as string[])
    : [];
  return features.map((feature, index) => {
    const split = feature.split(":");
    if (split.length >= 2) {
      const label = split[0].trim();
      const value = split.slice(1).join(":").trim();
      return {
        key: `legacy_${index}_${label.toLowerCase().replace(/\s+/g, "_")}`,
        labelDe: label,
        labelEn: label,
        value,
        sortOrder: index,
      };
    }
    return {
      key: `legacy_${index}`,
      labelDe: feature,
      labelEn: feature,
      value: "•",
      sortOrder: index,
    };
  });
}

/**
 * Build a value-based comparison matrix with identical keys across products.
 * Prefer AI-normalized specsJson; fall back to legacy feature strings.
 */
export function buildSpecMatrix(
  products: SpecMatrixProduct[],
  locale: "de" | "en" = "de",
) {
  const perProduct = products.map((product) => ({
    product,
    rows: rowsFromProduct(product),
  }));

  const keyMeta = new Map<string, SpecMatrixColumn & { sortOrder: number }>();

  for (const entry of perProduct) {
    for (const row of entry.rows) {
      const existing = keyMeta.get(row.key);
      if (existing) continue;
      keyMeta.set(row.key, {
        key: row.key,
        label: locale === "en" ? row.labelEn : row.labelDe,
        group: locale === "en" ? row.groupEn : row.groupDe,
        sortOrder: row.sortOrder ?? 999,
      });
    }
  }

  const columns = [...keyMeta.values()].sort((a, b) => {
    const groupA = a.group || "";
    const groupB = b.group || "";
    if (groupA !== groupB) return groupA.localeCompare(groupB);
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.label.localeCompare(b.label);
  });

  const matrixRows: SpecMatrixRow[] = perProduct.map(({ product, rows }) => {
    const byKey = new Map(rows.map((row) => [row.key, row]));
    return {
      id: product.id,
      title: product.title,
      ctaHref: product.ctaHref,
      values: columns.map((column) => {
        const match = byKey.get(column.key);
        if (!match) return null;
        const unit = match.unit ? ` ${match.unit}` : "";
        return `${match.value}${unit}`.trim();
      }),
    };
  });

  return {
    columns: columns.map(({ key, label, group }) => ({ key, label, group })),
    rows: matrixRows,
  };
}

export function featuresFromSpecsOrLegacy(
  product: { specsJson?: unknown; features?: unknown },
  locale: "de" | "en" = "de",
): string[] {
  const datasheet = parseStoredDatasheet(product.specsJson);
  if (datasheet?.rows?.length) {
    return datasheetToFeatureList(datasheet, locale);
  }
  return Array.isArray(product.features) ? (product.features as string[]) : [];
}
