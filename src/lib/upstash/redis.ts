import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis() {
  if (redis) return redis;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  redis = new Redis({ url, token });
  return redis;
}

/** Best-effort distributed lock. Returns true if lock acquired. */
export async function acquireLock(
  key: string,
  ttlSeconds: number,
): Promise<boolean> {
  const client = getRedis();
  if (!client) return true; // no Redis → allow (local/dev)

  const result = await client.set(`lock:${key}`, "1", {
    nx: true,
    ex: ttlSeconds,
  });
  return result === "OK";
}

export async function releaseLock(key: string) {
  const client = getRedis();
  if (!client) return;
  await client.del(`lock:${key}`);
}

export async function incrDailyCounter(name: string) {
  const client = getRedis();
  if (!client) return null;
  const day = new Date().toISOString().slice(0, 10);
  const key = `counter:${name}:${day}`;
  const value = await client.incr(key);
  if (value === 1) {
    await client.expire(key, 60 * 60 * 48);
  }
  return value;
}
