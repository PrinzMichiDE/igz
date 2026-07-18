import { prisma } from "@/lib/db/prisma";
import {
  buildGenericManualSearchLinks,
  buildManufacturerPortalLinks,
} from "@/lib/product-manuals/brands";
import {
  buildModelQuery,
  detectProductBrand,
  extractManualLinksFromAmazonData,
} from "@/lib/product-manuals/extract";
import type {
  ManualResolveInput,
  ManualResolveOptions,
  ProductManualLink,
} from "@/lib/product-manuals/types";

function parseStoredManualLinks(value: unknown): ProductManualLink[] {
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is ProductManualLink => {
    if (!item || typeof item !== "object") return false;
    const link = item as ProductManualLink;
    return (
      typeof link.title === "string" &&
      typeof link.url === "string" &&
      typeof link.source === "string"
    );
  });
}

function dedupeManualLinks(links: ProductManualLink[]) {
  const seen = new Set<string>();
  const result: ProductManualLink[] = [];

  for (const link of links) {
    const key = link.url.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(link);
  }

  return result;
}

export function resolveProductManuals(
  input: ManualResolveInput,
  options: ManualResolveOptions,
): ProductManualLink[] {
  const { locale } = options;

  if (!options.force) {
    const existing = parseStoredManualLinks(input.existingManualLinks);
    if (existing.length > 0) return existing;
  }

  const brand = detectProductBrand(input);
  const modelQuery = buildModelQuery(input.title, brand);

  const amazonLinks = extractManualLinksFromAmazonData(
    {
      rawSearchJson: input.rawSearchJson,
      rawDetailsJson: input.rawDetailsJson,
      productUrl: input.productUrl,
    },
    locale,
  );

  const manufacturerLinks = buildManufacturerPortalLinks(
    brand,
    modelQuery,
    locale,
  );

  const merged = dedupeManualLinks([...amazonLinks, ...manufacturerLinks]);

  if (merged.length > 0) {
    return merged.slice(0, 6);
  }

  return buildGenericManualSearchLinks(input.title, locale).slice(0, 1);
}

export function parseProductManualLinks(value: unknown): ProductManualLink[] {
  return parseStoredManualLinks(value);
}

export async function enrichProductManuals(
  productId: string,
  locale: "de" | "en" = "de",
  force = false,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) return [];

  const manualLinks = resolveProductManuals(
    {
      title: product.title,
      asin: product.asin,
      country: product.country,
      productUrl: product.productUrl,
      rawSearchJson: product.rawSearchJson,
      rawDetailsJson: product.rawDetailsJson,
      existingManualLinks: product.manualLinks,
    },
    { locale, force },
  );

  await prisma.product.update({
    where: { id: product.id },
    data: { manualLinks },
  });

  return manualLinks;
}

export async function enrichCategoryManuals(categoryId: string, locale: "de" | "en" = "de") {
  const products = await prisma.product.findMany({
    where: { categoryId },
    select: { id: true },
  });

  const results = [];
  for (const product of products) {
    const links = await enrichProductManuals(product.id, locale, false);
    results.push({ productId: product.id, count: links.length });
  }

  return results;
}
