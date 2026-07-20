import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Protects Vercel Cron / manual cron triggers.
 * Vercel injects `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set.
 *
 * Policy:
 * - Production / Vercel: CRON_SECRET required; missing config → 503.
 * - Local/dev without CRON_SECRET: allowed (so `npm run dev` cron smoke tests work).
 */
export function authorizeCronRequest(
  req: NextRequest,
): NextResponse | null {
  const secret = process.env.CRON_SECRET?.trim();
  const isHosted =
    process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (!secret) {
    if (isHosted) {
      return NextResponse.json(
        {
          ok: false,
          error: "CRON_SECRET is not configured",
        },
        { status: 503 },
      );
    }
    return null;
  }

  const provided = extractCronSecret(req);
  if (!provided || !safeEqual(provided, secret)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return null;
}

export function extractCronSecret(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (auth) {
    const match = /^Bearer\s+(.+)$/i.exec(auth.trim());
    if (match?.[1]) return match[1].trim();
  }

  const headerSecret = req.headers.get("x-cron-secret");
  if (headerSecret?.trim()) return headerSecret.trim();

  return null;
}

/** Exported for unit tests (timing-safe string compare). */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
