import { routing, type AppLocale } from "@/i18n/routing";

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getSiteName(locale: AppLocale = "de") {
  if (process.env.NEXT_PUBLIC_SITE_NAME) return process.env.NEXT_PUBLIC_SITE_NAME;
  return locale === "en" ? "IGZ Compare" : "IGZ Vergleich";
}

export function absoluteUrl(path = "") {
  const base = getSiteUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localizedPath(locale: string, path = "") {
  const clean = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `/${locale}${clean}`;
}

export function hreflangAlternates(pathWithoutLocale = "") {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(localizedPath(locale, pathWithoutLocale));
  }
  languages["x-default"] = absoluteUrl(
    localizedPath(routing.defaultLocale, pathWithoutLocale),
  );
  return languages;
}
