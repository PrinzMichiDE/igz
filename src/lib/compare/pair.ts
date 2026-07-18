export function buildComparePairSlug(slugA: string, slugB: string) {
  const [left, right] = [slugA, slugB].sort((a, b) => a.localeCompare(b));
  return `${left}-vs-${right}`;
}

export function parseComparePairSlug(pair: string) {
  const parts = pair.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return {
    slugA: parts[0],
    slugB: parts[1],
    canonical: buildComparePairSlug(parts[0], parts[1]),
  };
}

export function scoreOrZero(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
