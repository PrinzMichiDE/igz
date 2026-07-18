type Country = "DE" | "US" | string;

const DEFAULT_TAG_DE = "nerdiction-21";

export function getPartnerTag(country: Country = "DE") {
  if (country.toUpperCase() === "US") {
    return process.env.AMAZON_PARTNER_TAG_US || DEFAULT_TAG_DE;
  }
  return process.env.AMAZON_PARTNER_TAG_DE || DEFAULT_TAG_DE;
}

/**
 * Product deep link with Associate tag.
 * Default DE store ID: nerdiction-21
 */
export function buildAffiliateUrl(asin: string, country: Country = "DE"): string {
  const domain = country.toUpperCase() === "US" ? "com" : "de";
  const tag = getPartnerTag(country);
  const base = `https://www.amazon.${domain}/dp/${asin}`;
  const params = new URLSearchParams({
    tag,
    linkCode: "ll2",
    ref_: "as_li_ss_tl",
  });
  return `${base}?${params.toString()}`;
}

/**
 * Amazon store/homepage affiliate entry link (DE).
 */
export function buildAmazonStoreAffiliateUrl() {
  const tag = getPartnerTag("DE");
  const params = new URLSearchParams({
    linkCode: "ll2",
    tag,
    linkId: "c91eaf5d0587199898bc20a365090564",
    ref_: "as_li_ss_tl",
  });
  return `https://www.amazon.de?${params.toString()}`;
}

export function countryForLocale(locale: "de" | "en"): "DE" | "US" {
  // Keep EN recommendations on amazon.de with the DE associate tag for this project.
  return locale === "en" ? "DE" : "DE";
}
