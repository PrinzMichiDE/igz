export type SpecSeverity = "low" | "medium" | "high";

export type SpecRow = {
  key: string;
  labelDe: string;
  labelEn: string;
  value: string;
  unit?: string | null;
  groupDe?: string | null;
  groupEn?: string | null;
  sortOrder?: number;
};

export type ProductTechDatasheet = {
  version: 1;
  generatedAt: string;
  brandHint?: string | null;
  modelHint?: string | null;
  rows: SpecRow[];
  sourceNotesDe?: string | null;
  sourceNotesEn?: string | null;
};

export type KnownIssueSource = {
  title?: string | null;
  url: string;
};

export type KnownIssue = {
  titleDe: string;
  titleEn: string;
  summaryDe: string;
  summaryEn: string;
  severity: SpecSeverity;
  status?: "reported" | "widespread" | "fixed_in_update" | "unconfirmed" | null;
  sources?: KnownIssueSource[];
};

export type ProductKnownIssues = {
  version: 1;
  generatedAt: string;
  researchedAt?: string | null;
  disclaimerDe: string;
  disclaimerEn: string;
  issues: KnownIssue[];
};

export type ErrorCodeEntry = {
  code: string;
  meaningDe: string;
  meaningEn: string;
  stepsDe: string[];
  stepsEn: string[];
  severity?: SpecSeverity | null;
};

export type ProductErrorCodes = {
  version: 1;
  generatedAt: string;
  noteDe?: string | null;
  noteEn?: string | null;
  codes: ErrorCodeEntry[];
};

export type ProductTechProfileAiResponse = {
  datasheet: {
    brandHint?: string;
    modelHint?: string;
    sourceNotesDe?: string;
    sourceNotesEn?: string;
    rows: SpecRow[];
  };
  knownIssues: {
    disclaimerDe?: string;
    disclaimerEn?: string;
    issues: KnownIssue[];
  };
  errorCodes: {
    noteDe?: string;
    noteEn?: string;
    codes: ErrorCodeEntry[];
  };
};
