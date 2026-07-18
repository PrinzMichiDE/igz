import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import { resolveDatabaseUrl } from "@/lib/db/database-url";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

function resolvePrismaCliEntry() {
  try {
    return require.resolve("prisma/build/index.js");
  } catch {
    const fallback = path.join(
      process.cwd(),
      "node_modules",
      "prisma",
      "build",
      "index.js",
    );
    if (existsSync(fallback)) return fallback;
    throw new Error(
      "Prisma CLI not found in the serverless bundle. Ensure `prisma` is in dependencies and outputFileTracingIncludes covers it.",
    );
  }
}

/**
 * Run `prisma db push` inside the Vercel Node runtime without depending on
 * `scripts/prisma-db-push.mjs` (that file is not included in /var/task by default).
 */
export async function pushPrismaSchema() {
  const databaseUrl = resolveDatabaseUrl({ forSchemaPush: true });
  const prismaEntry = resolvePrismaCliEntry();
  const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
  const configPath = path.join(process.cwd(), "prisma.config.ts");

  if (!existsSync(schemaPath)) {
    throw new Error(
      `Missing ${schemaPath} in serverless bundle. Check next.config outputFileTracingIncludes.`,
    );
  }

  const args = [prismaEntry, "db", "push"];
  if (existsSync(configPath)) {
    args.push("--config", configPath);
  }

  const { stdout, stderr } = await execFileAsync(process.execPath, args, {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    cwd: process.cwd(),
    maxBuffer: 20 * 1024 * 1024,
  });

  return {
    stdout: stdout?.toString() ?? "",
    stderr: stderr?.toString() ?? "",
    prismaEntry,
  };
}
