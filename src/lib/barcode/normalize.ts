/** Normalize scanned retail barcodes / ASINs for lookup. */
export function normalizeBarcode(input: string) {
  return input.trim().replace(/[\s-]/g, "").toUpperCase();
}

export function isLikelyAsin(code: string) {
  return /^[A-Z0-9]{10}$/.test(code);
}

/** EAN-8, UPC-A (12), EAN-13, GTIN-14 */
export function isLikelyGtin(code: string) {
  return /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(code);
}

export function isValidBarcode(code: string) {
  return isLikelyAsin(code) || isLikelyGtin(code);
}

export function extractEanFromProductInfo(
  info?: Record<string, string> | null,
): string | null {
  if (!info) return null;
  const keys = Object.keys(info);
  const preferred = keys.find((key) =>
    /^(ean|gtin|upc|barcode|european article number)$/i.test(key.trim()),
  );
  const raw = preferred ? info[preferred] : null;
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (isLikelyGtin(digits)) return digits;
  return null;
}
