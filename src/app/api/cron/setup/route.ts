import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveDatabaseUrl } from "@/lib/db/database-url";
import { prisma } from "@/lib/db/prisma";
import { withDbRetry } from "@/lib/db/with-db-retry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const execFileAsync = promisify(execFile);

async function pushSchema() {
  await execFileAsync("npx", ["prisma", "db", "push", "--skip-generate"], {
    env: {
      ...process.env,
      DATABASE_URL: resolveDatabaseUrl(),
    },
    cwd: process.cwd(),
  });
}

async function runSeed() {
  await execFileAsync("npm", ["run", "db:seed"], {
    env: {
      ...process.env,
      DATABASE_URL: resolveDatabaseUrl(),
    },
    cwd: process.cwd(),
  });
}

export async function GET() {
  try {
    const databaseUrl = resolveDatabaseUrl();

    await withDbRetry(async () => {
      await prisma.$queryRaw`SELECT 1`;
    });

    let schemaPushed = false;
    try {
      await pushSchema();
      schemaPushed = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json(
        {
          ok: false,
          error: `Schema push failed: ${message}`,
          databaseUrlConfigured: Boolean(databaseUrl),
        },
        { status: 500 },
      );
    }

    const categoryCount = await prisma.category.count();
    let seeded = false;

    if (categoryCount === 0) {
      await runSeed();
      seeded = true;
    }

    const quota = await prisma.apiQuotaMonth.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      schemaPushed,
      seeded,
      categoryCount: await prisma.category.count(),
      quotaMonth: quota?.yearMonth ?? null,
      databaseHost: new URL(databaseUrl).hostname,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
