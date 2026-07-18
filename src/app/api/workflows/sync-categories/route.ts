import { serve } from "@upstash/workflow/nextjs";
import { ensureTopAmazonCategories } from "@/lib/amazon/sync-categories";
import { releaseLock } from "@/lib/upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Payload = {
  limit?: number;
  fetchFromApi?: boolean;
  country?: string;
  lockKey?: string;
};

export const { POST } = serve<Payload>(
  async (context) => {
    const payload = context.requestPayload || {};
    const lockKey = payload.lockKey || "cron:sync-categories";

    const result = await context.run("ensure-top-categories", async () => {
      return ensureTopAmazonCategories({
        country: payload.country || "DE",
        limit: Math.min(80, Math.max(1, Number(payload.limit || 50))),
        fetchFromApi: payload.fetchFromApi !== false,
      });
    });

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
      return { released: true };
    });

    return result;
  },
  {
    failureFunction: async ({ context }) => {
      const lockKey =
        context.requestPayload?.lockKey || "cron:sync-categories";
      await releaseLock(lockKey);
    },
  },
);
