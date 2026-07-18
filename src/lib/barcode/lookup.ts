import { buildAffiliateUrl } from "@/lib/amazon/affiliate";
import {
  gtinToAsin,
  parsePrice,
  parseRating,
  searchProducts,
  type AmazonGtinLookupProduct,
} from "@/lib/amazon/rapidapi";
import { QuotaExceededError } from "@/lib/amazon/quota";
import {
  isLikelyAsin,
  isLikelyGtin,
  isValidBarcode,
  normalizeBarcode,
} from "@/lib/barcode/normalize";
import { prisma } from "@/lib/db/prisma";
import { resolveProductImageSrc } from "@/lib/amazon/product-image";
import { getRedis } from "@/lib/upstash/redis";
import type { Locale } from "@prisma/client";

export type BarcodeLookupResult = {
  code: string;
  source: "db" | "cache" | "amazon_gtin" | "amazon_search";
  product: {
    id?: string;
    asin: string;
    slug?: string;
    title: string;
    imageUrl?: string | null;
    price?: number | null;
    currency?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    editorialScore?: number | null;
    affiliateUrl?: string | null;
    productUrl?: string | null;
    hasReview: boolean;
    reviewPath?: string | null;
  } | null;
  candidates?: Array<{
    asin: string;
    title: string;
    imageUrl?: string | null;
    price?: number | null;
    rating?: number | null;
  }>;
  messageKey?:
    | "invalid"
    | "not_found"
    | "quota"
    | "no_review"
    | "found_review"
    | "amazon_only";
};

function cacheKey(code: string, locale: string, country: string) {
  return `barcode:lookup:v1:${country}:${locale}:${code}`;
}

async function findDbProduct(code: string, country: string, locale: Locale) {
  const where = isLikelyAsin(code)
    ? { asin: code, country }
    : { ean: code, country };

  const product = await prisma.product.findFirst({
    where,
    select: {
      id: true,
      asin: true,
      slug: true,
      title: true,
      ean: true,
      imageUrl: true,
      imageMimeType: true,
      price: true,
      currency: true,
      rating: true,
      reviewCount: true,
      editorialScore: true,
      affiliateUrl: true,
      productUrl: true,
      articles: {
        where: { type: "review", locale, status: "published" },
        select: { slug: true },
        take: 1,
      },
    },
  });

  if (!product) return null;

  const hasReview = product.articles.length > 0;
  return {
    id: product.id,
    asin: product.asin,
    slug: product.slug,
    title: product.title,
    imageUrl: resolveProductImageSrc(product),
    price: product.price ? Number(product.price) : null,
    currency: product.currency,
    rating: product.rating,
    reviewCount: product.reviewCount,
    editorialScore: product.editorialScore,
    affiliateUrl: product.affiliateUrl,
    productUrl: product.productUrl,
    hasReview,
    reviewPath: hasReview ? `/${locale}/produkt/${product.slug}` : null,
  };
}

function mapAmazonCandidate(
  item: AmazonGtinLookupProduct,
  country: string,
) {
  if (!item.asin || !item.product_title) return null;
  return {
    asin: item.asin,
    title: item.product_title,
    imageUrl: item.product_photo || null,
    price: parsePrice(item.product_price),
    rating: parseRating(item.product_star_rating),
    currency: item.currency || (country === "US" ? "USD" : "EUR"),
    reviewCount: item.product_num_ratings ?? 0,
    affiliateUrl: buildAffiliateUrl(item.asin, country),
    productUrl: item.product_url || `https://www.amazon.de/dp/${item.asin}`,
  };
}

export async function lookupBarcode(input: {
  code: string;
  locale?: Locale;
  country?: string;
  allowLiveLookup?: boolean;
}): Promise<BarcodeLookupResult> {
  const code = normalizeBarcode(input.code);
  const locale = input.locale || "de";
  const country = input.country || "DE";
  const allowLiveLookup = input.allowLiveLookup !== false;

  if (!isValidBarcode(code)) {
    return {
      code,
      source: "db",
      product: null,
      messageKey: "invalid",
    };
  }

  const redis = getRedis();
  const key = cacheKey(code, locale, country);
  if (redis) {
    const cached = await redis.get<BarcodeLookupResult>(key);
    if (cached?.product || cached?.messageKey) {
      return { ...cached, source: "cache" };
    }
  }

  const dbProduct = await findDbProduct(code, country, locale);
  if (dbProduct) {
    const result: BarcodeLookupResult = {
      code,
      source: "db",
      product: dbProduct,
      messageKey: dbProduct.hasReview ? "found_review" : "no_review",
    };
    if (redis) await redis.set(key, result, { ex: 60 * 60 * 24 * 7 });
    return result;
  }

  // ASIN known locally under another country? still try DE first only.
  if (isLikelyAsin(code)) {
    const any = await prisma.product.findFirst({
      where: { asin: code },
      select: { country: true },
    });
    if (any && any.country !== country) {
      const alt = await findDbProduct(code, any.country, locale);
      if (alt) {
        return {
          code,
          source: "db",
          product: alt,
          messageKey: alt.hasReview ? "found_review" : "no_review",
        };
      }
    }
  }

  if (!allowLiveLookup) {
    return { code, source: "db", product: null, messageKey: "not_found" };
  }

  try {
    let candidates: NonNullable<ReturnType<typeof mapAmazonCandidate>>[] = [];

    if (isLikelyGtin(code)) {
      const gtinHits = await gtinToAsin({
        productIdentifier: code,
        country,
      });
      candidates = gtinHits
        .map((item: AmazonGtinLookupProduct) => mapAmazonCandidate(item, country))
        .filter(
          (
            item: ReturnType<typeof mapAmazonCandidate>,
          ): item is NonNullable<typeof item> => Boolean(item),
        );
    }

    if (candidates.length === 0) {
      const search = await searchProducts({ query: code, country });
      candidates = (search.products || [])
        .slice(0, 5)
        .map((item) =>
          mapAmazonCandidate(
            {
              asin: item.asin,
              product_title: item.product_title,
              product_price: item.product_price,
              currency: item.currency,
              product_star_rating: item.product_star_rating,
              product_num_ratings: item.product_num_ratings,
              product_url: item.product_url,
              product_photo: item.product_photo,
            },
            country,
          ),
        )
        .filter(
          (
            item: ReturnType<typeof mapAmazonCandidate>,
          ): item is NonNullable<typeof item> => Boolean(item),
        );
    }

    if (candidates.length === 0) {
      const result: BarcodeLookupResult = {
        code,
        source: isLikelyGtin(code) ? "amazon_gtin" : "amazon_search",
        product: null,
        messageKey: "not_found",
      };
      if (redis) await redis.set(key, result, { ex: 60 * 60 * 6 });
      return result;
    }

    // Prefer a candidate that already exists in our DB (with review).
    for (const candidate of candidates) {
      const existing = await findDbProduct(candidate.asin, country, locale);
      if (existing) {
        if (!existing.slug) continue;
        // Persist EAN on known product for faster next scan.
        if (isLikelyGtin(code)) {
          await prisma.product.updateMany({
            where: { asin: candidate.asin, country, ean: null },
            data: { ean: code },
          });
        }
        const result: BarcodeLookupResult = {
          code,
          source: "amazon_gtin",
          product: existing,
          candidates: candidates.map((c) => ({
            asin: c.asin,
            title: c.title,
            imageUrl: c.imageUrl,
            price: c.price,
            rating: c.rating,
          })),
          messageKey: existing.hasReview ? "found_review" : "no_review",
        };
        if (redis) await redis.set(key, result, { ex: 60 * 60 * 24 });
        return result;
      }
    }

    const best = candidates[0];
    const result: BarcodeLookupResult = {
      code,
      source: isLikelyGtin(code) ? "amazon_gtin" : "amazon_search",
      product: {
        asin: best.asin,
        title: best.title,
        imageUrl: best.imageUrl,
        price: best.price,
        currency: best.currency,
        rating: best.rating,
        reviewCount: best.reviewCount,
        affiliateUrl: best.affiliateUrl,
        productUrl: best.productUrl,
        hasReview: false,
        reviewPath: null,
      },
      candidates: candidates.map((c) => ({
        asin: c.asin,
        title: c.title,
        imageUrl: c.imageUrl,
        price: c.price,
        rating: c.rating,
      })),
      messageKey: "amazon_only",
    };
    if (redis) await redis.set(key, result, { ex: 60 * 60 * 12 });
    return result;
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return {
        code,
        source: "amazon_gtin",
        product: null,
        messageKey: "quota",
      };
    }
    throw error;
  }
}
