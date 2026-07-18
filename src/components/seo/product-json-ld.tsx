type Props = {
  locale: string;
  productTitle: string;
  productSlug: string;
  imageUrl?: string | null;
  description?: string | null;
  price?: string | null;
  currency?: string;
  rating?: number | null;
  reviewCount?: number;
  score?: number | null;
  faq?: Array<{ question: string; answer: string }>;
};

export function ProductJsonLd({
  locale,
  productTitle,
  productSlug,
  imageUrl,
  description,
  price,
  currency = "EUR",
  rating,
  reviewCount,
  score,
  faq,
}: Props) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://igz.example.com";
  const productUrl = `${siteUrl}/${locale}/produkt/${productSlug}`;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productTitle,
    url: productUrl,
    image: imageUrl || undefined,
    description: description || undefined,
  };

  if (price) {
    data.offers = {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: productUrl,
    };
  }

  if (typeof rating === "number" && reviewCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (typeof score === "number") {
    data.review = {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: score,
        bestRating: 10,
        worstRating: 0,
      },
      author: {
        "@type": "Organization",
        name: "IGZ Editorial",
      },
    };
  }

  if (faq && faq.length > 0) {
    data.mainEntity = faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
