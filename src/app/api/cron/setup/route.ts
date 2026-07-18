import { NextResponse } from "next/server";
import { resolveDatabaseUrl } from "@/lib/db/database-url";
import { prisma } from "@/lib/db/prisma";
import { pushPrismaSchema } from "@/lib/db/push-schema";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function shouldPushSchemaAtRuntime() {
  // On Vercel, `npm run build` already runs prisma db push. Spawning the Prisma
  // CLI inside a serverless function is brittle (missing transitive modules like
  // @prisma/debug). Opt in only with SCHEMA_PUSH_AT_RUNTIME=1.
  if (process.env.SCHEMA_PUSH_AT_RUNTIME === "1") return true;
  if (process.env.VERCEL === "1") return false;
  return process.env.SCHEMA_PUSH_AT_RUNTIME !== "0";
}

async function schemaLooksReady() {
  // Cheap readiness probe: core tables used by the app.
  await prisma.category.count();
  await prisma.product.count();
  await prisma.apiQuotaMonth.count();
  return true;
}

export async function GET() {
  try {
    const databaseUrl = resolveDatabaseUrl();

    await withDbRetry(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });

    let schemaPushed = false;
    let schemaPushSkipped: string | null = null;
    let schemaPushError: string | null = null;
    let schemaPushLog: string | null = null;
    let schemaReady = false;

    try {
      schemaReady = await schemaLooksReady();
    } catch {
      schemaReady = false;
    }

    if (!shouldPushSchemaAtRuntime()) {
      schemaPushSkipped =
        "Schema sync runs at Vercel build time (npm run build → prisma db push). Runtime CLI push is disabled; set SCHEMA_PUSH_AT_RUNTIME=1 to force it.";
    } else if (schemaReady && process.env.SCHEMA_PUSH_AT_RUNTIME !== "1") {
      schemaPushSkipped = "Schema already looks ready; skipping runtime db push.";
    } else {
      try {
        const result = await pushPrismaSchema();
        schemaPushed = true;
        schemaReady = true;
        schemaPushLog = [result.stdout, result.stderr]
          .filter(Boolean)
          .join("\n")
          .slice(0, 2000);
      } catch (error) {
        schemaPushError =
          error instanceof Error ? error.message : "Unknown schema push error";
      }
    }

    if (!schemaReady && schemaPushError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Database schema is not ready and runtime push failed: ${schemaPushError}`,
          schemaPushed,
          schemaPushSkipped,
          databaseHost: new URL(databaseUrl).hostname,
        },
        { status: 500 },
      );
    }

    const categoryCount = await prisma.category.count();
    let seeded = false;

    if (categoryCount === 0) {
      try {
        const { runSeed } = await import("../../../../../prisma/seed");
        await runSeed();
        seeded = true;
      } catch (error) {
        const seedError =
          error instanceof Error ? error.message : "Unknown seed error";
        return NextResponse.json(
          {
            ok: false,
            error: `Seed failed: ${seedError}`,
            schemaPushed,
            schemaPushSkipped,
            schemaPushError,
            databaseUrlConfigured: true,
            databaseHost: new URL(databaseUrl).hostname,
          },
          { status: 500 },
        );
      }
    }

    let purgedDemo: Awaited<
      ReturnType<typeof import("@/lib/db/purge-demo-data").purgeDemoData>
    > | null = null;
    let purgeDemoError: string | null = null;
    try {
      const { purgeDemoData } = await import("@/lib/db/purge-demo-data");
      purgedDemo = await purgeDemoData();
    } catch (error) {
      purgeDemoError =
        error instanceof Error ? error.message : "Unknown demo purge error";
    }

    let topCategories: Awaited<
      ReturnType<
        typeof import("@/lib/amazon/sync-categories").ensureTopAmazonCategories
      >
    > | null = null;
    let topCategoriesError: string | null = null;
    try {
      const { ensureTopAmazonCategories } = await import(
        "@/lib/amazon/sync-categories"
      );
      // Prefer curated Top 50 without spending RapidAPI quota during setup.
      // Live Amazon IDs can be refreshed via /api/cron/sync-categories.
      topCategories = await ensureTopAmazonCategories({
        limit: 50,
        fetchFromApi: false,
      });
    } catch (error) {
      topCategoriesError =
        error instanceof Error ? error.message : "Unknown top-categories error";
    }

    const quota = await prisma.apiQuotaMonth.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      schemaReady: true,
      schemaPushed,
      schemaPushSkipped,
      schemaPushError,
      schemaPushLog,
      seeded,
      purgedDemo,
      purgeDemoError,
      topCategories,
      topCategoriesError,
      categoryCount: await prisma.category.count(),
      productCount: await prisma.product.count(),
      quotaMonth: quota?.yearMonth ?? null,
      databaseHost: new URL(databaseUrl).hostname,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: formatDatabaseError(error) },
      { status: 500 },
    );
  }
}
