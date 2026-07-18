const PLACEHOLDER_HOSTS = new Set([
  "host",
  "base",
  "example.com",
  "example.org",
]);

const CANDIDATE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_DATABASE_URL",
] as const;

function appendQueryParam(url: string, key: string, value: string) {
  if (url.includes(`${key}=`)) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${key}=${value}`;
}

function normalizeCandidate(raw: string) {
  let value = raw.trim();

  // Vercel/UI copy-paste often wraps values in quotes.
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  // Common accidental prefixes from dashboards / env files.
  value = value.replace(/^DATABASE_URL\s*=\s*/i, "").trim();

  // prisma+postgres / prisma:// are Accelerate/Data-Proxy URLs and cannot be
  // used for `prisma db push` against a real Postgres instance.
  if (/^prisma(\+postgres)?:\/\//i.test(value)) {
    return null;
  }

  // Normalize postgres:// → postgresql:// for broader Prisma compatibility.
  if (value.startsWith("postgres://")) {
    value = `postgresql://${value.slice("postgres://".length)}`;
  }

  if (!/^postgresql:\/\//i.test(value)) {
    return null;
  }

  return value;
}

function isUsableDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname || PLACEHOLDER_HOSTS.has(hostname)) {
      return false;
    }
    // On Vercel, localhost URLs are never reachable during build.
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

export function listDatabaseUrlCandidates() {
  const values: Array<{ key: string; url: string }> = [];

  for (const key of CANDIDATE_ENV_KEYS) {
    const raw = process.env[key];
    if (!raw) continue;
    const normalized = normalizeCandidate(raw);
    if (!normalized) continue;
    if (!isUsableDatabaseUrl(normalized)) continue;
    values.push({ key, url: normalized });
  }

  return values;
}

export function resolveDatabaseUrl(options?: { forSchemaPush?: boolean }) {
  const candidates = listDatabaseUrlCandidates();

  if (candidates.length === 0) {
    throw new Error(
      "No usable Postgres URL found. Set DATABASE_URL to postgresql://... or link Vercel Postgres (POSTGRES_PRISMA_URL / POSTGRES_URL). Accelerate URLs (prisma+postgres://) are not supported for db push.",
    );
  }

  // Prefer non-pooling URLs for schema push / migrations when available.
  let selected = candidates[0];
  if (options?.forSchemaPush) {
    selected =
      candidates.find((c) =>
        /NON_POOLING|UNPOOLED|PRISMA_URL/i.test(c.key),
      ) ?? candidates[0];
  }

  let connectionString = selected.url;
  connectionString = appendQueryParam(connectionString, "connect_timeout", "30");

  if (
    process.env.NODE_ENV === "production" &&
    !connectionString.includes("sslmode=")
  ) {
    connectionString = appendQueryParam(connectionString, "sslmode", "require");
  }

  return connectionString;
}
