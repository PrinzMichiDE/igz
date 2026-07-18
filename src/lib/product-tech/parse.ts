import type {
  ErrorCodeEntry,
  KnownIssue,
  ProductErrorCodes,
  ProductKnownIssues,
  ProductTechDatasheet,
  ProductTechProfileAiResponse,
  SpecRow,
  SpecSeverity,
} from "@/lib/product-tech/types";

function asString(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function asStringArray(value: unknown, maxItems = 8, maxLen = 240): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asString(item, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
}

function asSeverity(value: unknown): SpecSeverity {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}

function slugKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

function parseRow(raw: unknown, index: number): SpecRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const labelDe = asString(row.labelDe, 80);
  const labelEn = asString(row.labelEn, 80) || labelDe;
  const value = asString(row.value, 160);
  if (!labelDe || !value) return null;

  const key =
    slugKey(asString(row.key, 64) || labelEn || labelDe) || `spec_${index + 1}`;

  return {
    key,
    labelDe,
    labelEn,
    value,
    unit: asString(row.unit, 24) || null,
    groupDe: asString(row.groupDe, 60) || null,
    groupEn: asString(row.groupEn, 60) || null,
    sortOrder:
      typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder)
        ? Math.round(row.sortOrder)
        : index,
  };
}

function parseIssue(raw: unknown): KnownIssue | null {
  if (!raw || typeof raw !== "object") return null;
  const issue = raw as Record<string, unknown>;
  const titleDe = asString(issue.titleDe, 140);
  const titleEn = asString(issue.titleEn, 140) || titleDe;
  const summaryDe = asString(issue.summaryDe, 600);
  const summaryEn = asString(issue.summaryEn, 600) || summaryDe;
  if (!titleDe || !summaryDe) return null;

  const sources = Array.isArray(issue.sources)
    ? issue.sources
        .map((source) => {
          if (!source || typeof source !== "object") return null;
          const item = source as Record<string, unknown>;
          const url = asString(item.url, 500);
          if (!url.startsWith("http")) return null;
          return {
            title: asString(item.title, 120) || null,
            url,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .slice(0, 4)
    : [];

  const statusRaw = asString(issue.status, 40);
  const status =
    statusRaw === "reported" ||
    statusRaw === "widespread" ||
    statusRaw === "fixed_in_update" ||
    statusRaw === "unconfirmed"
      ? statusRaw
      : "unconfirmed";

  return {
    titleDe,
    titleEn,
    summaryDe,
    summaryEn,
    severity: asSeverity(issue.severity),
    status,
    sources,
  };
}

function parseErrorCode(raw: unknown): ErrorCodeEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const code = raw as Record<string, unknown>;
  const codeValue = asString(code.code, 40);
  const meaningDe = asString(code.meaningDe, 240);
  const meaningEn = asString(code.meaningEn, 240) || meaningDe;
  const stepsDe = asStringArray(code.stepsDe, 8, 240);
  const stepsEn = asStringArray(code.stepsEn, 8, 240);
  if (!codeValue || !meaningDe || stepsDe.length === 0) return null;

  return {
    code: codeValue,
    meaningDe,
    meaningEn,
    stepsDe,
    stepsEn: stepsEn.length > 0 ? stepsEn : stepsDe,
    severity: asSeverity(code.severity),
  };
}

export function normalizeTechProfileResponse(
  payload: ProductTechProfileAiResponse | Record<string, unknown>,
): {
  datasheet: ProductTechDatasheet;
  knownIssues: ProductKnownIssues;
  errorCodes: ProductErrorCodes;
} {
  const now = new Date().toISOString();
  const root = payload as ProductTechProfileAiResponse;
  const datasheetRaw = root.datasheet || ({} as ProductTechProfileAiResponse["datasheet"]);
  const issuesRaw = root.knownIssues || ({} as ProductTechProfileAiResponse["knownIssues"]);
  const codesRaw = root.errorCodes || ({} as ProductTechProfileAiResponse["errorCodes"]);

  const rows = (Array.isArray(datasheetRaw.rows) ? datasheetRaw.rows : [])
    .map((row, index) => parseRow(row, index))
    .filter((row): row is SpecRow => Boolean(row))
    .slice(0, 40);

  // Dedupe by key, keep first
  const seen = new Set<string>();
  const uniqueRows: SpecRow[] = [];
  for (const row of rows) {
    if (seen.has(row.key)) continue;
    seen.add(row.key);
    uniqueRows.push(row);
  }

  const issues = (Array.isArray(issuesRaw.issues) ? issuesRaw.issues : [])
    .map((issue) => parseIssue(issue))
    .filter((issue): issue is KnownIssue => Boolean(issue))
    .slice(0, 12);

  const codes = (Array.isArray(codesRaw.codes) ? codesRaw.codes : [])
    .map((code) => parseErrorCode(code))
    .filter((code): code is ErrorCodeEntry => Boolean(code))
    .slice(0, 20);

  return {
    datasheet: {
      version: 1,
      generatedAt: now,
      brandHint: asString(datasheetRaw.brandHint, 80) || null,
      modelHint: asString(datasheetRaw.modelHint, 120) || null,
      rows: uniqueRows,
      sourceNotesDe: asString(datasheetRaw.sourceNotesDe, 300) || null,
      sourceNotesEn: asString(datasheetRaw.sourceNotesEn, 300) || null,
    },
    knownIssues: {
      version: 1,
      generatedAt: now,
      researchedAt: now,
      disclaimerDe:
        asString(issuesRaw.disclaimerDe, 400) ||
        "Liste bekannter Probleme aus öffentlichen Berichten und typischen Nutzerhinweisen. Keine Garantie auf Vollständigkeit; Einzelfälle können abweichen.",
      disclaimerEn:
        asString(issuesRaw.disclaimerEn, 400) ||
        "List of known issues from public reports and typical user notes. Not guaranteed to be complete; individual units may differ.",
      issues,
    },
    errorCodes: {
      version: 1,
      generatedAt: now,
      noteDe:
        asString(codesRaw.noteDe, 400) ||
        "Typische Fehlercodes und erste Schritte zur Behebung. Bei anhaltenden Problemen Hersteller-Support oder Händler kontaktieren.",
      noteEn:
        asString(codesRaw.noteEn, 400) ||
        "Typical error codes and first remediation steps. Contact manufacturer support or your retailer if problems persist.",
      codes,
    },
  };
}

export function parseStoredDatasheet(value: unknown): ProductTechDatasheet | null {
  if (!value || typeof value !== "object") return null;
  const data = value as ProductTechDatasheet;
  if (!Array.isArray(data.rows) || data.rows.length === 0) return null;
  return data;
}

export function parseStoredKnownIssues(value: unknown): ProductKnownIssues | null {
  if (!value || typeof value !== "object") return null;
  const data = value as ProductKnownIssues;
  if (!Array.isArray(data.issues)) return null;
  return data;
}

export function parseStoredErrorCodes(value: unknown): ProductErrorCodes | null {
  if (!value || typeof value !== "object") return null;
  const data = value as ProductErrorCodes;
  if (!Array.isArray(data.codes)) return null;
  return data;
}

/** Convert normalized datasheet into stable "Label: Value" feature strings. */
export function datasheetToFeatureList(
  datasheet: ProductTechDatasheet,
  locale: "de" | "en" = "de",
): string[] {
  return datasheet.rows.map((row) => {
    const label = locale === "en" ? row.labelEn : row.labelDe;
    const unit = row.unit ? ` ${row.unit}` : "";
    return `${label}: ${row.value}${unit}`.trim();
  });
}
