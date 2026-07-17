import type { Metadata } from "next";
import {
  absoluteUrl,
  getSiteName,
  hreflangAlternates,
  localizedPath,
} from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";

type BuildMetadataInput = {
  locale: AppLocale;
  title: string;
  description: string;
  pathWithoutLocale: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: string | Date | null;
  modifiedTime?: string | Date | null;
  noIndex?: boolean;
};

export function buildPageMetadata(input: BuildMetadataInput): Metadata {
  const siteName = getSiteName(input.locale);
  const canonicalPath = localizedPath(input.locale, input.pathWithoutLocale);
  const canonical = absoluteUrl(canonicalPath);
  const image = input.image || absoluteUrl("/og-default.svg");

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical,
      languages: hreflangAlternates(input.pathWithoutLocale),
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type: input.type || "website",
      locale: input.locale === "en" ? "en_US" : "de_DE",
      url: canonical,
      siteName,
      title: input.title,
      description: input.description,
      images: [{ url: image, alt: input.title }],
      ...(input.publishedTime
        ? { publishedTime: new Date(input.publishedTime).toISOString() }
        : {}),
      ...(input.modifiedTime
        ? { modifiedTime: new Date(input.modifiedTime).toISOString() }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}
