function isTransientDbError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNREFUSED") ||
    message.includes("connection timeout")
  );
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
