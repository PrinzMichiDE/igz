const PLACEHOLDER_HOSTS = new Set(["host", "base"]);

function appendQueryParam(url: string, key: string, value: string) {
  if (url.includes(`${key}=`)) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${key}=${value}`;
}

function validateDatabaseHost(url: string) {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(
      "DATABASE_URL is malformed. Use a full postgres URL or connect Vercel Postgres in the project settings.",
    );
  }

  if (!hostname || PLACEHOLDER_HOSTS.has(hostname)) {
    throw new Error(
      `Database host "${hostname}" looks like a placeholder. Set DATABASE_URL in Vercel (or link Vercel Postgres so POSTGRES_PRISMA_URL is available).`,
    );
  }
}

export function resolveDatabaseUrl() {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    process.env.POSTGRES_URL_NON_POOLING;

  if (!url) {
    throw new Error(
      "Database URL missing. Set DATABASE_URL or connect Vercel Postgres (POSTGRES_PRISMA_URL).",
    );
  }

  validateDatabaseHost(url);

  let connectionString = url;
  connectionString = appendQueryParam(connectionString, "connect_timeout", "30");

  if (
    process.env.NODE_ENV === "production" &&
    !connectionString.includes("sslmode=")
  ) {
    connectionString = appendQueryParam(connectionString, "sslmode", "require");
  }

  return connectionString;
}
