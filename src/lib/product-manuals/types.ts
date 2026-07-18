export type ManualLinkSource =
  | "manufacturer"
  | "amazon"
  | "support_portal";

export type ProductManualLink = {
  title: string;
  url: string;
  source: ManualLinkSource;
  language?: "de" | "en" | "multilingual";
};

export type ManualResolveInput = {
  title: string;
  asin: string;
  country: string;
  productUrl?: string | null;
  rawSearchJson?: unknown;
  rawDetailsJson?: unknown;
  existingManualLinks?: unknown;
};

export type ManualResolveOptions = {
  locale: "de" | "en";
  force?: boolean;
};
