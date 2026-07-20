import { NextRequest, NextResponse } from "next/server";
import { resolveDatabaseUrl } from "@/lib/db/database-url";
import { prisma } from "@/lib/db/prisma";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";
import { authorizeCronRequest } from "@/lib/security/cron-auth";
import { enqueueOrRunInline } from "@/lib/workflows/trigger-cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const denied = authorizeCronRequest(req);
  if (denied) return denied;

  try {
    return await enqueueOrRunInline(
      {
        lockKey: "cron:setup",
        workflowPath: "/api/workflows/setup",
        body: { lockKey: "cron:setup" },
      },
      async () => {
        const databaseUrl = resolveDatabaseUrl();
        await withDbRetry(async () => {
          await prisma.$queryRaw`SELECT 1`;
        });

        let seeded = false;
        const categoryCount = await prisma.category.count();
        if (categoryCount === 0) {
          const { runSeed } = await import("../../../../../prisma/seed");
          await runSeed();
          seeded = true;
        }

        const { purgeDemoData } = await import("@/lib/db/purge-demo-data");
        const purgedDemo = await purgeDemoData();

        const { ensureTopAmazonCategories } = await import(
          "@/lib/amazon/sync-categories"
        );
        const topCategories = await ensureTopAmazonCategories({
          limit: 50,
          fetchFromApi: false,
        });

        const { backfillReviewPublishedDates } = await import(
          "@/lib/reviews/backfill-published-at"
        );
        const reviewDates = await backfillReviewPublishedDates({ limit: 200 });

        return {
          seeded,
          purgedDemo,
          topCategories,
          reviewDates,
          categoryCount: await prisma.category.count(),
          productCount: await prisma.product.count(),
          databaseHost: new URL(databaseUrl).hostname,
        };
      },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
