import { NextResponse } from "next/server";
import { resolveDatabaseUrl } from "@/lib/db/database-url";
import { prisma } from "@/lib/db/prisma";
import { pushPrismaSchema } from "@/lib/db/push-schema";
import { formatDatabaseError, withDbRetry } from "@/lib/db/with-db-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  try {
    const databaseUrl = resolveDatabaseUrl();

    await withDbRetry(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });

    let schemaPushed = false;
    let schemaPushError: string | null = null;
    let schemaPushLog: string | null = null;

    try {
      const result = await pushPrismaSchema();
      schemaPushed = true;
      schemaPushLog = [result.stdout, result.stderr].filter(Boolean).join("\n").slice(0, 2000);
    } catch (error) {
      // Build already runs db push; runtime push can fail if CLI/files are
      // missing. Continue to seed when the DB is reachable.
      schemaPushError =
        error instanceof Error ? error.message : "Unknown schema push error";
    }

    const categoryCount = await prisma.category.count();
    let seeded = false;
    let seedError: string | null = null;

    if (categoryCount === 0) {
      try {
        // Import seed only when needed so the route stays lean on warm paths.
        const { runSeed } = await import("../../../../../prisma/seed");
        await runSeed();
        seeded = true;
      } catch (error) {
        seedError = error instanceof Error ? error.message : "Unknown seed error";
        return NextResponse.json(
          {
            ok: false,
            error: `Seed failed: ${seedError}`,
            schemaPushed,
            schemaPushError,
            databaseUrlConfigured: true,
            databaseHost: new URL(databaseUrl).hostname,
          },
          { status: 500 },
        );
      }
    }

    const quota = await prisma.apiQuotaMonth.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      schemaPushed,
      schemaPushError,
      schemaPushLog,
      seeded,
      categoryCount: await prisma.category.count(),
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
