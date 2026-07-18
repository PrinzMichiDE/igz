function isPlaceholderHostError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /Can't reach database server at [`']?(base|host)[`']?/i.test(message) ||
    message.includes('Placeholder hosts like "base"')
  );
}

function isTransientDbError(error: unknown) {
  if (isPlaceholderHostError(error)) return false;
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNREFUSED") ||
    message.includes("connection timeout")
  );
}

export function formatDatabaseError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (isPlaceholderHostError(error) || /server at [`']?base[`']?/i.test(message)) {
    return [
      "Database URL points at placeholder host \"base\"/\"host\".",
      "In Vercel → Settings → Environment Variables: delete the bad DATABASE_URL",
      "or set it to your real postgresql:// connection string,",
      "and/or link Vercel Postgres / Neon so POSTGRES_PRISMA_URL is injected.",
      "Then redeploy.",
    ].join(" ");
  }
  return message;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withDbRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 2000,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1 && isTransientDbError(error)) {
        await wait(delayMs * (attempt + 1));
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
