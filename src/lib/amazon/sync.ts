import { prisma } from "@/lib/db/prisma";
import { buildAffiliateUrl } from "@/lib/amazon/affiliate";
import {
  getProductDetails,
  parsePrice,
  parseRating,
  searchProducts,
} from "@/lib/amazon/rapidapi";
import { QuotaExceededError } from "@/lib/amazon/quota";
import { enrichProductManuals } from "@/lib/product-manuals";
import { slugify } from "@/lib/utils";
import type { JobType } from "@prisma/client";

function productSlug(asin: string, title: string) {
  const base = slugify(title) || "product";
  return `${base}-${asin.toLowerCase()}`;
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

      await prisma.product.upsert({
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

      await prisma.product.update({
        where: { id: product.id },
        data: {
          title: details.product_title || product.title,
          imageUrl: details.product_photo || product.imageUrl,
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
      await enrichProductManuals(
        product.id,
        category.countryScope === "US" ? "en" : "de",
        true,
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
