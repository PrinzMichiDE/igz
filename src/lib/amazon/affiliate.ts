type Country = "DE" | "US" | string;

export function buildAffiliateUrl(asin: string, country: Country = "DE"): string {
  const domain = country.toUpperCase() === "US" ? "com" : "de";
  const tag =
    country.toUpperCase() === "US"
      ? process.env.AMAZON_PARTNER_TAG_US
      : process.env.AMAZON_PARTNER_TAG_DE;

  const base = `https://www.amazon.${domain}/dp/${asin}`;
  if (!tag) return base;
  return `${base}?tag=${encodeURIComponent(tag)}`;
}

export function countryForLocale(locale: "de" | "en"): "DE" | "US" {
  return locale === "en" ? "US" : "DE";
}
