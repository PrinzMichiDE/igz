#!/usr/bin/env node
/**
 * Runs Prisma generate + schema sync before local start and Vercel builds.
 * Prefers `migrate deploy`; falls back to `db push` for DBs that were
 * previously provisioned without migration history.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1";
const skipSync = process.env.PRISMA_SKIP_SCHEMA_SYNC === "1";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });

  if (result.error) {
    console.error(`[prisma-prepare] Failed to start ${command}:`, result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

function runPrisma(args) {
  return run("npx", ["prisma", ...args]);
}

console.log(
  `[prisma-prepare] Starting (${isVercel ? "vercel" : "local"}${skipSync ? ", sync skipped" : ""})`,
);

const generateCode = runPrisma(["generate"]);
if (generateCode !== 0) {
  process.exit(generateCode);
}

if (skipSync) {
  console.log("[prisma-prepare] PRISMA_SKIP_SCHEMA_SYNC=1 – done after generate");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "[prisma-prepare] DATABASE_URL is missing – schema sync skipped (generate only)",
  );
  process.exit(0);
}

const deployCode = runPrisma(["migrate", "deploy"]);
if (deployCode === 0) {
  console.log("[prisma-prepare] migrate deploy succeeded");
  process.exit(0);
}

console.warn(
  "[prisma-prepare] migrate deploy failed – falling back to prisma db push",
);
const pushCode = runPrisma(["db", "push"]);
if (pushCode === 0) {
  console.log("[prisma-prepare] db push succeeded");
  process.exit(0);
}

if (isVercel) {
  console.error(
    "[prisma-prepare] Schema sync failed on Vercel – aborting build/start",
  );
  process.exit(pushCode || deployCode || 1);
}

console.warn(
  "[prisma-prepare] Schema sync failed locally – continuing (set a reachable DATABASE_URL or PRISMA_SKIP_SCHEMA_SYNC=1)",
);
process.exit(0);
