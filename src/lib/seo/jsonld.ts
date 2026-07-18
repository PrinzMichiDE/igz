import { absoluteUrl, getSiteName, getSiteUrl } from "@/lib/seo/site";
import type { AppLocale } from "@/i18n/routing";
import type { ReviewContent } from "@/lib/content-types";

type FaqItem = { question: string; answer: string };

export function organizationJsonLd(locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: getSiteName(locale),
    url: getSiteUrl(),
    logo: absoluteUrl("/og-default.svg"),
  };
}

export function websiteJsonLd(locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getSiteName(locale),
    url: absoluteUrl(`/${locale}`),
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl(`/${locale}`)}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(faq: FaqItem[] = []) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function productReviewJsonLd(input: {
  locale: AppLocale;
  name: string;
  description: string;
  image?: string | null;
  asin: string;
  sku?: string;
  brand?: string;
  price?: number | string | null;
  currency?: string;
  rating?: number | null;
  reviewCount?: number;
  editorialScore?: number | null;
  url: string;
  reviewBody?: string;
  reviewTitle?: string;
  datePublished?: string | Date | null;
  faq?: FaqItem[];
  keyTakeaways?: string[];
}) {
  const score = input.editorialScore ?? input.rating ?? undefined;
  const price =
    input.price === null || input.price === undefined
      ? undefined
      : Number(input.price);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description,
    image: input.image ? [input.image] : undefined,
    sku: input.sku || input.asin,
    mpn: input.asin,
    brand: input.brand
      ? { "@type": "Brand", name: input.brand }
      : undefined,
    url: input.url,
    aggregateRating:
      typeof input.rating === "number"
        ? {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount || 1,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    offers:
      typeof price === "number" && Number.isFinite(price)
        ? {
            "@type": "Offer",
            url: input.url,
            priceCurrency: input.currency || "EUR",
            price: price.toFixed(2),
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          }
        : undefined,
    review: {
      "@type": "Review",
      name: input.reviewTitle || input.name,
      reviewBody: input.reviewBody || input.description,
      inLanguage: input.locale,
      datePublished: input.datePublished
        ? new Date(input.datePublished).toISOString()
        : undefined,
      author: {
        "@type": "Organization",
        name: getSiteName(input.locale),
      },
      reviewRating:
        typeof score === "number"
          ? {
              "@type": "Rating",
              ratingValue: score,
              bestRating: 10,
              worstRating: 0,
            }
          : undefined,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".aeo-direct-answer", ".aeo-key-takeaways"],
    },
    additionalProperty: (input.keyTakeaways || []).map((value) => ({
      "@type": "PropertyValue",
      name: "KeyTakeaway",
      value,
    })),
  };
}

export function itemListJsonLd(input: {
  name: string;
  description?: string;
  url: string;
  items: Array<{ name: string; url: string; position: number }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    description: input.description,
    url: input.url,
    itemListElement: input.items.map((item) => ({
      "@type": "ListItem",
      position: item.position,
      url: item.url,
      name: item.name,
    })),
  };
}

export function aeoAnswerJsonLd(input: {
  question: string;
  answer: string;
  url: string;
  locale: AppLocale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: input.question,
      inLanguage: input.locale,
      acceptedAnswer: {
        "@type": "Answer",
        text: input.answer,
        url: input.url,
        author: {
          "@type": "Organization",
          name: getSiteName(input.locale),
        },
      },
    },
  };
}

export function extractAeoFields(content: ReviewContent) {
  return {
    directAnswer: content.directAnswer || content.verdict || content.excerpt || "",
    keyTakeaways: content.keyTakeaways || [],
    scoreBreakdown: content.scoreBreakdown,
    decisionGuide: content.decisionGuide,
  };
}
