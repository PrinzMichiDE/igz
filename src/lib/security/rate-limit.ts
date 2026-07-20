import { getRedis } from "@/lib/upstash/redis";
import {
  getClientIp,
  rateLimitFingerprint,
} from "@/lib/security/client-ip";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Fixed-window rate limit. Uses Upstash Redis when configured; otherwise an
 * in-process Map (best-effort on a single serverless isolate / local dev).
 */
export async function checkRateLimit(options: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = options;
  const redis = getRedis();

  if (redis) {
    const redisKey = `ratelimit:${key}`;
    const value = await redis.incr(redisKey);
    if (value === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    const ttl = await redis.ttl(redisKey);
    const resetSeconds = ttl > 0 ? ttl : windowSeconds;
    return {
      allowed: value <= limit,
      remaining: Math.max(0, limit - value),
      limit,
      resetSeconds,
    };
  }

  const now = Date.now();
  const existing = memoryBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      limit,
      resetSeconds: windowSeconds,
    };
  }

  existing.count += 1;
  const resetSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000),
  );
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    limit,
    resetSeconds,
  };
}

export async function enforceIpRateLimit(
  req: NextRequest,
  options: {
    bucket: string;
    limit: number;
    windowSeconds: number;
  },
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const key = `${options.bucket}:${rateLimitFingerprint(ip)}`;
  const result = await checkRateLimit({
    key,
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  });

  if (result.allowed) return null;

  return NextResponse.json(
    {
      ok: false,
      error: "Too many requests",
      retryAfterSeconds: result.resetSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.resetSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    },
  );
}

/** Test helper – clears in-memory buckets between cases. */
export function resetMemoryRateLimits() {
  memoryBuckets.clear();
}
