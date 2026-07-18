import { prisma } from "@/lib/db/prisma";
import { buildAffiliateUrl } from "@/lib/amazon/affiliate";
import {
  downloadProductImage,
  pickBestProductImageUrl,
} from "@/lib/amazon/product-image";
import {
  getProductDetails,
  parsePrice,
  parseRating,
  searchProducts,
} from "@/lib/amazon/rapidapi";
import { QuotaExceededError } from "@/lib/amazon/quota";
import { enrichProductManuals } from "@/lib/product-manuals";
import { recordPriceSnapshot } from "@/lib/price-history";
import { numericPrice } from "@/lib/product-links";
import { slugify } from "@/lib/utils";
import type { JobType } from "@prisma/client";

function productSlug(asin: string, title: string) {
  const base = slugify(title) || "product";
  return `${base}-${asin.toLowerCase()}`;
}

async function storeProductImageIfNeeded(input: {
  productId: string;
  imageUrl?: string | null;
  force?: boolean;
}) {
  const { productId, imageUrl, force = false } = input;
  if (!imageUrl) return false;

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      imageUrl: true,
      imageData: true,
      imageFetchedAt: true,
    },
  });

  if (!existing) return false;

  const urlChanged = existing.imageUrl !== imageUrl;
  const missingData = !existing.imageData || existing.imageData.length === 0;
  if (!force && !urlChanged && !missingData) return false;

  const downloaded = await downloadProductImage(imageUrl);
  if (!downloaded) return false;

  await prisma.product.update({
    where: { id: productId },
    data: {
      imageUrl,
      imageData: Uint8Array.from(downloaded.data),
      imageMimeType: downloaded.mimeType,
      imageFetchedAt: new Date(),
    },
  });

  return true;
}

export async function backfillMissingProductImages(limit = 50) {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { imageUrl: { not: null }, imageMimeType: null },
        { imageUrl: { not: null }, imageData: null },
        { imageUrl: { not: null }, imageFetchedAt: null },
      ],
    },
    select: {
      id: true,
      imageUrl: true,
      rawDetailsJson: true,
      rawSearchJson: true,
    },
    take: limit,
    orderBy: { updatedAt: "desc" },
  });

  let stored = 0;
  for (const product of products) {
    const details = product.rawDetailsJson as
      | { product_photo?: string; product_photos?: string[] }
      | null;
    const search = product.rawSearchJson as { product_photo?: string } | null;
    const imageUrl = pickBestProductImageUrl({
      primary: details?.product_photo || product.imageUrl,
      gallery: details?.product_photos,
      fallback: search?.product_photo || product.imageUrl,
    });

    const ok = await storeProductImageIfNeeded({
      productId: product.id,
      imageUrl,
      force: true,
    });
    if (ok) stored += 1;
  }

  return { checked: products.length, stored };
}

export async function syncCategorySearch(categoryId: string) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
  });

  const job = await prisma.jobRun.create({
    data: {
      type: "sync_search" satisfies JobType,
      status: "running",
      startedAt: new Date(),
      message: `Search sync for ${category.slug}`,
    },
  });

  let requestsUsed = 0;

  try {
    const query = category.searchKeywords[0] || category.nameDe;
    const data = await searchProducts({
      query,
      country: category.countryScope,
      categoryId: category.amazonCategoryId || undefined,
    });
    requestsUsed += 1;

    const products = data.products ?? [];
    let upserted = 0;

    for (const item of products) {
      if (!item.asin || !item.product_title) continue;

      const price = parsePrice(item.product_price);
      const rating = parseRating(item.product_star_rating);

      const product = await prisma.product.upsert({
        where: {
          asin_country: {
            asin: item.asin,
            country: category.countryScope,
          },
        },
        create: {
          asin: item.asin,
          country: category.countryScope,
          slug: productSlug(item.asin, item.product_title),
          title: item.product_title,
          imageUrl: item.product_photo,
          price: price ?? undefined,
          currency: item.currency || (category.countryScope === "US" ? "USD" : "EUR"),
          rating: rating ?? undefined,
          reviewCount: item.product_num_ratings ?? 0,
          productUrl: item.product_url,
          affiliateUrl: buildAffiliateUrl(item.asin, category.countryScope),
          rawSearchJson: item,
          lastSyncedAt: new Date(),
          categoryId: category.id,
        },
        update: {
          title: item.product_title,
          imageUrl: item.product_photo,
          price: price ?? undefined,
          currency: item.currency || (category.countryScope === "US" ? "USD" : "EUR"),
          rating: rating ?? undefined,
          reviewCount: item.product_num_ratings ?? 0,
          productUrl: item.product_url,
          affiliateUrl: buildAffiliateUrl(item.asin, category.countryScope),
          rawSearchJson: item,
          lastSyncedAt: new Date(),
          categoryId: category.id,
        },
      });

      await storeProductImageIfNeeded({
        productId: product.id,
        imageUrl: pickBestProductImageUrl({
          primary: item.product_photo,
          fallback: product.imageUrl,
        }),
      });
      upserted += 1;

      const saved = await prisma.product.findUnique({
        where: {
          asin_country: {
            asin: item.asin,
            country: category.countryScope,
          },
        },
        select: { id: true },
      });
      if (saved) {
        await enrichProductManuals(
          saved.id,
          category.countryScope === "US" ? "en" : "de",
          false,
        );
        await recordPriceSnapshot(
          saved.id,
          parsePrice(item.product_price),
          item.currency || (category.countryScope === "US" ? "USD" : "EUR"),
        );
      }
    }

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        requestsUsed,
        message: `Upserted ${upserted} products for ${category.slug}`,
        metricsJson: { upserted, totalReturned: products.length },
      },
    });

    return { upserted, requestsUsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: error instanceof QuotaExceededError ? "skipped" : "failed",
        finishedAt: new Date(),
        requestsUsed,
        error: message,
      },
    });
    throw error;
  }
}

export async function syncCategoryDetails(categoryId: string, topN = 5) {
  const category = await prisma.category.findUniqueOrThrow({
    where: { id: categoryId },
  });

  const products = await prisma.product.findMany({
    where: { categoryId },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    take: topN,
  });

  const job = await prisma.jobRun.create({
    data: {
      type: "sync_details",
      status: "running",
      startedAt: new Date(),
      message: `Details sync for ${category.slug} (top ${topN})`,
    },
  });

  let requestsUsed = 0;
  let enriched = 0;

  try {
    for (const product of products) {
      const details = await getProductDetails({
        asin: product.asin,
        country: product.country,
      });
      requestsUsed += 1;

      const price = parsePrice(details.product_price) ?? product.price;
      const rating = parseRating(details.product_star_rating) ?? product.rating;
      const features =
        details.about_product ||
        Object.entries(details.product_information || {}).map(
          ([k, v]) => `${k}: ${v}`,
        );

      const nextImageUrl = pickBestProductImageUrl({
        primary: details.product_photo,
        gallery: details.product_photos,
        fallback: product.imageUrl,
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          title: details.product_title || product.title,
          imageUrl: nextImageUrl,
          price: price ?? undefined,
          currency:
            details.currency ||
            product.currency ||
            (product.country === "US" ? "USD" : "EUR"),
          rating: rating ?? undefined,
          reviewCount: details.product_num_ratings ?? product.reviewCount,
          features,
          productUrl: details.product_url || product.productUrl,
          affiliateUrl: buildAffiliateUrl(product.asin, product.country),
          rawDetailsJson: details,
          lastSyncedAt: new Date(),
        },
      });

      await storeProductImageIfNeeded({
        productId: product.id,
        imageUrl: nextImageUrl,
      });

      await enrichProductManuals(
        product.id,
        category.countryScope === "US" ? "en" : "de",
        true,
      );
      await recordPriceSnapshot(
        product.id,
        numericPrice(price),
        details.currency ||
          product.currency ||
          (product.country === "US" ? "USD" : "EUR"),
      );
      enriched += 1;
    }

    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        requestsUsed,
        message: `Enriched ${enriched} products`,
        metricsJson: { enriched },
      },
    });

    return { enriched, requestsUsed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.jobRun.update({
      where: { id: job.id },
      data: {
        status: error instanceof QuotaExceededError ? "skipped" : "failed",
        finishedAt: new Date(),
        requestsUsed,
        error: message,
        metricsJson: { enriched },
      },
    });
    throw error;
  }
}
