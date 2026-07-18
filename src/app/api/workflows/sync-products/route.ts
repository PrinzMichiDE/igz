import { serve } from "@upstash/workflow/nextjs";
import {
  backfillMissingProductImages,
  listTopProductIds,
  syncCategorySearch,
  syncProductDetails,
} from "@/lib/amazon/sync";
import { getQuotaStatus, QuotaExceededError } from "@/lib/amazon/quota";
import { resolveCronCategory } from "@/lib/cron";
import { releaseLock } from "@/lib/upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Payload = {
  category?: string | null;
  top?: number;
  lockKey?: string;
};

export const { POST } = serve<Payload>(
  async (context) => {
    const payload = context.requestPayload || {};
    const lockKey = payload.lockKey || "cron:sync-products";
    const topN = Math.min(8, Math.max(1, Number(payload.top || 3)));

    const category = await context.run("resolve-category", async () => {
      const resolved = await resolveCronCategory(payload.category || null);
      if (!resolved) {
        throw new Error("No category found. Run setup first.");
      }
      return {
        id: resolved.id,
        slug: resolved.slug,
      };
    });

    const quotaBefore = await context.run("quota-before", async () => {
      return getQuotaStatus();
    });

    const searchResult = await context.run("search-sync", async () => {
      return syncCategorySearch(category.id);
    });

    const products = await context.run("list-top-products", async () => {
      return listTopProductIds(category.id, topN);
    });

    const details: Array<{
      productId: string;
      asin: string;
      ok: boolean;
      error?: string;
    }> = [];

    for (const product of products) {
      const step = await context.run(`details-${product.asin}`, async () => {
        try {
          const result = await syncProductDetails(product.id);
          return { ...result, ok: true as const };
        } catch (error) {
          if (error instanceof QuotaExceededError) {
            return {
              productId: product.id,
              asin: product.asin,
              ok: false as const,
              error: "quota_exceeded",
              imageStored: false,
              requestsUsed: 0,
            };
          }
          throw error;
        }
      });
      details.push({
        productId: step.productId,
        asin: step.asin,
        ok: step.ok,
        error: "error" in step ? step.error : undefined,
      });
      if ("error" in step && step.error === "quota_exceeded") break;
    }

    // Small image batches per step to stay under Vercel timeouts.
    const imageBatches = [];
    for (let i = 0; i < 4; i += 1) {
      const batch = await context.run(`images-${i}`, async () => {
        return backfillMissingProductImages(12);
      });
      imageBatches.push(batch);
      if (batch.checked === 0) break;
    }

    const quotaAfter = await context.run("quota-after", async () => {
      return getQuotaStatus();
    });

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
      return { released: true };
    });

    return {
      ok: true,
      category: category.slug,
      searchResult,
      details,
      imageBatches,
      quota: { before: quotaBefore, after: quotaAfter },
    };
  },
  {
    failureFunction: async ({ context }) => {
      const lockKey = context.requestPayload?.lockKey || "cron:sync-products";
      await releaseLock(lockKey);
    },
  },
);
