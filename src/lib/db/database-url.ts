const PLACEHOLDER_HOSTS = new Set([
  "host",
  "base",
  "example.com",
  "example.org",
  "db.example.com",
  "xxx",
  "localhost",
  "127.0.0.1",
]);

/** Prefer Vercel/Neon injected URLs before a possibly stale DATABASE_URL. */
const CANDIDATE_ENV_KEYS = [
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_DATABASE_URL",
  "DATABASE_URL",
] as const;

function appendQueryParam(url: string, key: string, value: string) {
  if (new RegExp(`[?&]${key}=`, "i").test(url)) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${key}=${value}`;
}

function replaceOrSetQueryParam(url: string, key: string, value: string) {
  if (new RegExp(`[?&]${key}=`, "i").test(url)) {
    return url.replace(
      new RegExp(`([?&])${key}=[^&]*`, "i"),
      `$1${key}=${value}`,
    );
  }
  return appendQueryParam(url, key, value);
}

function envDisablesSsl() {
  const mode = (process.env.DATABASE_SSL_MODE || process.env.PGSSLMODE || "")
    .trim()
    .toLowerCase();
  if (mode === "disable" || mode === "allow") return true;
  const flag = (process.env.DATABASE_SSL || "").trim().toLowerCase();
  return flag === "0" || flag === "false" || flag === "off" || flag === "disable";
}

function urlDisablesSsl(url: string) {
  return /[?&]sslmode=(disable|allow)(?:&|$)/i.test(url);
}

/** True when TLS must not be used (server without SSL, e.g. some VPS Postgres). */
export function isSslDisabled(connectionString?: string) {
  if (envDisablesSsl()) return true;
  if (connectionString && urlDisablesSsl(connectionString)) return true;
  // Honor sslmode=disable on any configured URL candidate (even if another
  // POSTGRES_* URL without sslmode is selected first).
  for (const key of CANDIDATE_ENV_KEYS) {
    const raw = process.env[key];
    if (raw && /[?&]sslmode=(disable|allow)(?:&|$)/i.test(raw)) return true;
  }
  return false;
}

/**
 * Apply sslmode for Prisma/pg.
 * - Honors ?sslmode=disable / DATABASE_SSL_MODE=disable
 * - Otherwise defaults to require on Vercel/production when unset
 */
export function applySslMode(connectionString: string) {
  if (isSslDisabled(connectionString)) {
    return replaceOrSetQueryParam(connectionString, "sslmode", "disable");
  }

  if (
    (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") &&
    !/[?&]sslmode=/i.test(connectionString)
  ) {
    return appendQueryParam(connectionString, "sslmode", "require");
  }

  return connectionString;
}

/** node-postgres `ssl` option: never force TLS when sslmode=disable. */
export function pgPoolSslOption(connectionString: string) {
  if (isSslDisabled(connectionString)) {
    return undefined;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return { rejectUnauthorized: false as const };
  }
  return undefined;
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
  // used with the node-postgres adapter / db push against real Postgres.
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

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isUsableDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (!hostname) return false;

    // Always reject known placeholders (including "base" from bad templates).
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

    // On Vercel, reject classic .env.example credentials and localhost.
    const exampleCreds =
      parsed.username === "user" &&
      (parsed.password === "password" || parsed.password === "pass");
    if (process.env.VERCEL === "1") {
      if (exampleCreds || isLocalHost(hostname)) return false;
    }

    // Locally, still reject example credentials against non-local hosts.
    if (exampleCreds && !isLocalHost(hostname)) {
      return false;
    }

    // Single-label hosts (no dot) are almost never valid managed Postgres.
    // Allow localhost only outside Vercel.
    if (!hostname.includes(".")) {
      return isLocalHost(hostname) && process.env.VERCEL !== "1";
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
    if (!isUsableDatabaseUrl(normalized)) {
      continue;
    }
    values.push({ key, url: normalized });
  }

  return values;
}

export function describeDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`;
  } catch {
    return "(unparseable)";
  }
}

/**
 * Resolve a usable Postgres URL and publish it back to process.env.DATABASE_URL
 * so Prisma internals never keep reading a placeholder like host "base".
 */
export function resolveDatabaseUrl(options?: { forSchemaPush?: boolean }) {
  const candidates = listDatabaseUrlCandidates();

  if (candidates.length === 0) {
    const present = CANDIDATE_ENV_KEYS.filter((key) => Boolean(process.env[key]));
    throw new Error(
      [
        "No usable Postgres URL found.",
        "Set DATABASE_URL to a real postgresql://USER:PASS@HOST/DB string,",
        "or link Vercel Postgres / Neon (POSTGRES_PRISMA_URL / POSTGRES_URL).",
        'Placeholder hosts like "base" or "host" are rejected.',
        present.length
          ? `Present but unusable env keys: ${present.join(", ")}.`
          : "No DATABASE_URL/POSTGRES_* env keys were set.",
      ].join(" "),
    );
  }

  let selected = candidates[0];
  if (options?.forSchemaPush) {
    selected =
      candidates.find((c) =>
        /NON_POOLING|UNPOOLED|PRISMA_URL/i.test(c.key),
      ) ?? candidates[0];
  }

  let connectionString = selected.url;
  connectionString = appendQueryParam(connectionString, "connect_timeout", "30");
  connectionString = applySslMode(connectionString);

  // Critical: overwrite DATABASE_URL so Prisma/pg never fall back to a
  // placeholder value still sitting in the Vercel env (e.g. host "base"),
  // and so sslmode=disable wins over a stale sslmode=require.
  process.env.DATABASE_URL = connectionString;
  if (isSslDisabled(connectionString)) {
    process.env.PGSSLMODE = "disable";
    process.env.DATABASE_SSL_MODE = process.env.DATABASE_SSL_MODE || "disable";
  }

  // Discrete libpq vars can override/confuse node-postgres if they are junk.
  for (const key of ["PGHOST", "PGHOSTADDR", "PGDATABASE", "PGUSER", "PGPASSWORD"]) {
    const value = process.env[key];
    if (!value) continue;
    const lower = value.toLowerCase();
    if (
      PLACEHOLDER_HOSTS.has(lower) ||
      lower === "user" ||
      lower === "password" ||
      lower === "pass"
    ) {
      delete process.env[key];
    }
  }

  if (process.env.DEBUG_DATABASE_URL === "1") {
    console.info(
      `[db] using ${selected.key} → ${describeDatabaseUrl(connectionString)}`,
    );
  }

  return connectionString;
}
