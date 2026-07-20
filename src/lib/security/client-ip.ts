import { createHmac, createHash } from "crypto";
import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * HMAC-SHA256 of the client IP when IP_HASH_SECRET (or AUTH_SECRET) is set.
 * Falls back to salted SHA-256 so plain IPs are never stored.
 */
export function hashClientIp(ip: string): string {
  const secret =
    process.env.IP_HASH_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "igz-ip-hash-dev-only";

  return createHmac("sha256", secret).update(ip).digest("hex");
}

/** Deterministic fingerprint for rate-limit keys (not for storage). */
export function rateLimitFingerprint(ip: string): string {
  return createHash("sha256").update(`rl:${ip}`).digest("hex").slice(0, 32);
}
