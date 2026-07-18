#!/usr/bin/env node
/**
 * Resolve a usable Postgres URL (Vercel Postgres fallbacks) and run
 * `prisma db push` with it. Avoids P1013 when DATABASE_URL is a bad/placeholder
 * or an Accelerate URL while POSTGRES_* is valid.
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";

// Plain-JS resolver (no TS loader needed during Vercel build).
const PLACEHOLDER_HOSTS = new Set(["host", "base", "example.com", "example.org"]);

const CANDIDATE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_DATABASE_URL",
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
    if (!hostname || PLACEHOLDER_HOSTS.has(hostname)) return false;
    if (
      process.env.VERCEL === "1" &&
      (hostname === "localhost" || hostname === "127.0.0.1")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
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
      "No usable Postgres URL found. Set DATABASE_URL=postgresql://... or link Vercel Postgres (POSTGRES_PRISMA_URL).",
    );
  }

  const selected =
    candidates.find((c) => /NON_POOLING|UNPOOLED|PRISMA_URL/i.test(c.key)) ??
    candidates[0];

  let url = selected.url;
  if (!url.includes("connect_timeout=")) {
    url += `${url.includes("?") ? "&" : "?"}connect_timeout=30`;
  }
  if (process.env.NODE_ENV === "production" && !url.includes("sslmode=")) {
    url += `${url.includes("?") ? "&" : "?"}sslmode=require`;
  }

  console.log(`[prisma-db-push] Using ${selected.key}`);
  return url;
}

const databaseUrl = resolveUrl();
const result = spawnSync("npx", ["prisma", "db", "push"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
  shell: false,
});

process.exit(result.status ?? 1);
