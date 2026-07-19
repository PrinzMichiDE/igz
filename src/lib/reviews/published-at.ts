/**
 * Resolve a stable review `publishedAt` from product age.
 * - Prefer Amazon "Date First Available" / "Im Angebot seit"
 * - Fallback: product.createdAt
 * - If before 2020-01-01 UTC → deterministic date between 2020 and now
 * - Never in the future
 */

const MIN_PUBLICATION_UTC = Date.UTC(2020, 0, 1);

const FIRST_AVAILABLE_KEYS = [
  "date first available",
  "datefirstavailable",
  "im angebot von amazon.de seit",
  "im angebot von amazon seit",
  "im angebot seit",
  "erstverfügbarkeitsdatum",
  "erstverfuegbarkeitsdatum",
  "verfügbar seit",
  "verfuegbar seit",
  "availability date",
  "release date",
  "publication date",
];

const DE_MONTHS: Record<string, number> = {
  januar: 0,
  jan: 0,
  februar: 1,
  feb: 1,
  marz: 2,
  maerz: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mai: 4,
  juni: 5,
  jun: 5,
  juli: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  oktober: 9,
  okt: 9,
  november: 10,
  nov: 10,
  dezember: 11,
  dez: 11,
};

const EN_MONTHS: Record<string, number> = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeKey(key: string) {
  return key
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function extractProductInformationMap(
  rawDetailsJson: unknown,
): Record<string, string> {
  const root = asRecord(rawDetailsJson);
  const data = asRecord(root.data);
  const info = asRecord(
    root.product_information ??
      root.product_details ??
      data.product_information ??
      data.product_details,
  );
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(info)) {
    if (typeof value === "string" && value.trim()) {
      result[key] = value.trim();
    } else if (typeof value === "number" || typeof value === "boolean") {
      result[key] = String(value);
    }
  }
  return result;
}

function findFirstAvailableRaw(info: Record<string, string>): string | null {
  for (const [key, value] of Object.entries(info)) {
    const normalized = normalizeKey(key);
    if (
      FIRST_AVAILABLE_KEYS.some(
        (candidate) =>
          normalized === normalizeKey(candidate) ||
          normalized.includes(normalizeKey(candidate)),
      )
    ) {
      return value;
    }
  }
  return null;
}

function parseDayMonthYear(
  day: number,
  month: number,
  year: number,
): Date | null {
  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    year < 1995 ||
    year > 2100 ||
    month < 0 ||
    month > 11 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const utc = Date.UTC(year, month, day, 12, 0, 0);
  const date = new Date(utc);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function parseAmazonDateString(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  // ISO / YYYY-MM-DD
  const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return parseDayMonthYear(
      Number(iso[3]),
      Number(iso[2]) - 1,
      Number(iso[1]),
    );
  }

  // DD.MM.YYYY or DD/MM/YYYY
  const numeric = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (numeric) {
    return parseDayMonthYear(
      Number(numeric[1]),
      Number(numeric[2]) - 1,
      Number(numeric[3]),
    );
  }

  // "5. Juni 2018" / "5 Juni 2018"
  const de = value.match(/^(\d{1,2})\.?\s+([A-Za-zÄÖÜäöüß]+)\s+(\d{4})$/u);
  if (de) {
    const monthKey = normalizeKey(de[2]).replace(/\s+/g, "");
    const month = DE_MONTHS[monthKey];
    if (month != null) {
      return parseDayMonthYear(Number(de[1]), month, Number(de[3]));
    }
  }

  // "June 5, 2018" / "June 5 2018"
  const en = value.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (en) {
    const month = EN_MONTHS[normalizeKey(en[1])];
    if (month != null) {
      return parseDayMonthYear(Number(en[2]), month, Number(en[3]));
    }
  }

  const native = new Date(value);
  if (!Number.isNaN(native.getTime())) {
    return native;
  }
  return null;
}

/** Stable uint32 from a string (FNV-1a). */
export function stableHash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Deterministic date between 2020-01-01 and `now` (inclusive day window).
 * Same seed → same date.
 */
export function dateBetween2020AndNow(seed: string, now = new Date()): Date {
  const end = Math.min(now.getTime(), Date.now());
  const start = MIN_PUBLICATION_UTC;
  if (end <= start) {
    return new Date(start);
  }
  const span = end - start;
  const offset = stableHash32(seed) % span;
  // Keep noon UTC for stable calendar days across TZ display.
  const picked = new Date(start + offset);
  return new Date(
    Date.UTC(
      picked.getUTCFullYear(),
      picked.getUTCMonth(),
      picked.getUTCDate(),
      12,
      0,
      0,
    ),
  );
}

export function clampReviewPublishedAt(
  candidate: Date,
  seed: string,
  now = new Date(),
): Date {
  const time = candidate.getTime();
  if (!Number.isFinite(time)) {
    return dateBetween2020AndNow(seed, now);
  }
  if (time < MIN_PUBLICATION_UTC) {
    return dateBetween2020AndNow(seed, now);
  }
  if (time > now.getTime()) {
    return now;
  }
  return candidate;
}

export function extractProductAgeDate(input: {
  rawDetailsJson?: unknown;
  createdAt?: Date | string | null;
}): Date | null {
  const info = extractProductInformationMap(input.rawDetailsJson);
  const raw = findFirstAvailableRaw(info);
  if (raw) {
    const parsed = parseAmazonDateString(raw);
    if (parsed) return parsed;
  }
  if (input.createdAt) {
    const created =
      input.createdAt instanceof Date
        ? input.createdAt
        : new Date(input.createdAt);
    if (!Number.isNaN(created.getTime())) return created;
  }
  return null;
}

export function resolveReviewPublishedAt(input: {
  productId: string;
  asin?: string | null;
  rawDetailsJson?: unknown;
  createdAt?: Date | string | null;
  now?: Date;
}): Date {
  const now = input.now ?? new Date();
  const seed = input.asin || input.productId;
  const age = extractProductAgeDate({
    rawDetailsJson: input.rawDetailsJson,
    createdAt: input.createdAt,
  });
  if (!age) {
    return dateBetween2020AndNow(seed, now);
  }
  return clampReviewPublishedAt(age, seed, now);
}
