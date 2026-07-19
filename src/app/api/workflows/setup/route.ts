import { serve } from "@upstash/workflow/nextjs";
import { resolveDatabaseUrl } from "@/lib/db/database-url";
import { prisma } from "@/lib/db/prisma";
import { withDbRetry } from "@/lib/db/with-db-retry";
import { releaseLock } from "@/lib/upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Payload = {
  lockKey?: string;
};

export const { POST } = serve<Payload>(
  async (context) => {
    const lockKey = context.requestPayload?.lockKey || "cron:setup";

    const health = await context.run("db-health", async () => {
      const databaseUrl = resolveDatabaseUrl();
      await withDbRetry(async () => {
        await prisma.$queryRaw`SELECT 1`;
      });
      return { databaseHost: new URL(databaseUrl).hostname };
    });

    const seeded = await context.run("seed-if-empty", async () => {
      const categoryCount = await prisma.category.count();
      if (categoryCount > 0) {
        return { seeded: false, categoryCount };
      }
      const { runSeed } = await import("../../../../../prisma/seed");
      await runSeed();
      return {
        seeded: true,
        categoryCount: await prisma.category.count(),
      };
    });

    const purgedDemo = await context.run("purge-demo", async () => {
      const { purgeDemoData } = await import("@/lib/db/purge-demo-data");
      return purgeDemoData();
    });

    const topCategories = await context.run("top-categories", async () => {
      const { ensureTopAmazonCategories } = await import(
        "@/lib/amazon/sync-categories"
      );
      return ensureTopAmazonCategories({
        limit: 50,
        fetchFromApi: false,
      });
    });

    const reviewDates = await context.run("backfill-review-dates", async () => {
      const { backfillReviewPublishedDates } = await import(
        "@/lib/reviews/backfill-published-at"
      );
      return backfillReviewPublishedDates({ limit: 200 });
    });

    await context.run("release-lock", async () => {
      await releaseLock(lockKey);
      return { released: true };
    });

    return {
      ok: true,
      health,
      seeded,
      purgedDemo,
      topCategories,
      reviewDates,
    };
  },
  {
    failureFunction: async ({ context }) => {
      const lockKey = context.requestPayload?.lockKey || "cron:setup";
      await releaseLock(lockKey);
    },
  },
);
