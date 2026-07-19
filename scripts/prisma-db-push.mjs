#!/usr/bin/env node
/**
 * Resolve a usable Postgres URL (Vercel Postgres fallbacks) and sync schema.
 * Prefers `prisma migrate deploy`; falls back to `prisma db push`.
 * On Vercel/CI, db push uses `--accept-data-loss` so non-interactive builds
 * can apply additive unique constraints (Prisma otherwise aborts with a warning).
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";

const CANDIDATE_ENV_KEYS = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_DATABASE_URL",
  "DATABASE_URL",
];

function normalizeCandidate(raw) {
  let value = String(raw).trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  value = value.replace(/^DATABASE_URL\s*=\s*/i, "").trim();
  if (/^prisma(\+postgres)?:\/\//i.test(value)) return null;
  if (value.startsWith("postgres://")) {
    value = `postgresql://${value.slice("postgres://".length)}`;
  }
  if (!/^postgresql:\/\//i.test(value)) return null;
  return value;
}

function isUsable(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) return false;
    if (
      hostname === "host" ||
      hostname === "base" ||
      hostname === "example.com" ||
      hostname === "example.org" ||
      hostname === "db.example.com" ||
      hostname === "xxx"
    ) {
      return false;
    }
    const exampleCreds =
      parsed.username === "user" &&
      (parsed.password === "password" || parsed.password === "pass");
    const local = hostname === "localhost" || hostname === "127.0.0.1";
    if (process.env.VERCEL === "1" && (exampleCreds || local)) {
      return false;
    }
    if (exampleCreds && !local) {
      return false;
    }
    if (!hostname.includes(".")) {
      return local && process.env.VERCEL !== "1";
    }
    return true;
  } catch {
    return false;
  }
}

function envDisablesSsl() {
  const mode = (process.env.DATABASE_SSL_MODE || process.env.PGSSLMODE || "")
    .trim()
    .toLowerCase();
  if (mode === "disable" || mode === "allow") return true;
  const flag = (process.env.DATABASE_SSL || "").trim().toLowerCase();
  return flag === "0" || flag === "false" || flag === "off" || flag === "disable";
}

function anyCandidateDisablesSsl() {
  if (envDisablesSsl()) return true;
  for (const key of CANDIDATE_ENV_KEYS) {
    const raw = process.env[key];
    if (raw && /[?&]sslmode=(disable|allow)(?:&|$)/i.test(String(raw))) {
      return true;
    }
  }
  return false;
}

function applySslMode(url) {
  if (anyCandidateDisablesSsl() || /[?&]sslmode=(disable|allow)(?:&|$)/i.test(url)) {
    if (/[?&]sslmode=/i.test(url)) {
      return url.replace(/([?&])sslmode=[^&]*/i, "$1sslmode=disable");
    }
    return `${url}${url.includes("?") ? "&" : "?"}sslmode=disable`;
  }

  if (
    (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") &&
    !/[?&]sslmode=/i.test(url)
  ) {
    return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
  }

  return url;
}

function resolveUrl() {
  const candidates = [];
  for (const key of CANDIDATE_ENV_KEYS) {
    const raw = process.env[key];
    if (!raw) continue;
    const normalized = normalizeCandidate(raw);
    if (!normalized || !isUsable(normalized)) {
      console.warn(`[prisma-db-push] Skipping ${key}: not a usable postgres URL`);
      continue;
    }
    candidates.push({ key, url: normalized });
  }

  if (candidates.length === 0) {
    throw new Error(
      'No usable Postgres URL found. Remove placeholder DATABASE_URL hosts like "base"/"host" and link Vercel Postgres (POSTGRES_PRISMA_URL) or set a real postgresql:// URL.',
    );
  }

  const selected =
    candidates.find((c) => /NON_POOLING|UNPOOLED|PRISMA_URL/i.test(c.key)) ??
    candidates[0];

  let url = selected.url;
  if (!/[?&]connect_timeout=/i.test(url)) {
    url += `${url.includes("?") ? "&" : "?"}connect_timeout=30`;
  }
  url = applySslMode(url);

  let host = "?";
  let sslmode = "default";
  try {
    host = new URL(url).hostname;
    sslmode = /[?&]sslmode=([^&]+)/i.exec(url)?.[1] ?? "default";
  } catch {
    // ignore
  }
  console.log(
    `[prisma-db-push] Using ${selected.key} (host=${host}, sslmode=${sslmode})`,
  );
  return url;
}

function shouldAcceptDataLoss() {
  if (process.env.PRISMA_ACCEPT_DATA_LOSS === "0") return false;
  if (process.env.PRISMA_ACCEPT_DATA_LOSS === "1") return true;
  if (process.env.VERCEL === "1") return true;
  const ci = (process.env.CI || "").toLowerCase();
  return ci === "1" || ci === "true";
}

function runPrisma(args, env) {
  const result = spawnSync("npx", ["prisma", ...args], {
    stdio: "inherit",
    env,
    shell: false,
  });
  return result.status ?? 1;
}

const databaseUrl = resolveUrl();

for (const key of ["PGHOST", "PGHOSTADDR", "PGDATABASE", "PGUSER", "PGPASSWORD"]) {
  const value = process.env[key];
  if (!value) continue;
  const lower = value.toLowerCase();
  if (["host", "base", "user", "password", "pass", "localhost"].includes(lower)) {
    delete process.env[key];
  }
}

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
};

if (/[?&]sslmode=disable(?:&|$)/i.test(databaseUrl) || envDisablesSsl()) {
  env.PGSSLMODE = "disable";
  env.DATABASE_SSL_MODE = env.DATABASE_SSL_MODE || "disable";
}

const skipMigrate = process.env.PRISMA_SKIP_MIGRATE_DEPLOY === "1";
if (!skipMigrate) {
  console.log("[prisma-db-push] Trying prisma migrate deploy…");
  const deployCode = runPrisma(["migrate", "deploy"], env);
  if (deployCode === 0) {
    console.log("[prisma-db-push] migrate deploy succeeded");
    process.exit(0);
  }
  console.warn(
    `[prisma-db-push] migrate deploy exited ${deployCode} – falling back to db push`,
  );
}

const pushArgs = ["db", "push"];
if (shouldAcceptDataLoss()) {
  pushArgs.push("--accept-data-loss");
  console.warn(
    "[prisma-db-push] Using --accept-data-loss for non-interactive schema sync",
  );
}

const pushCode = runPrisma(pushArgs, env);
if (pushCode === 0) {
  console.log("[prisma-db-push] db push succeeded");
  process.exit(0);
}

process.exit(pushCode);
