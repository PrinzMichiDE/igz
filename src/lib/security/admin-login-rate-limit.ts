import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { enforceIpRateLimit } from "@/lib/security/rate-limit";

export const ADMIN_LOGIN_RATE_LIMIT = {
  bucket: "admin-login",
  limit: 10,
  windowSeconds: 3600,
} as const;

/** NextAuth v5 credential sign-in POST paths. */
export function isAdminCredentialsAuthRequest(pathname: string): boolean {
  return (
    pathname.endsWith("/callback/credentials") ||
    pathname.endsWith("/signin/credentials")
  );
}

export async function enforceAdminLoginRateLimit(
  req: NextRequest,
): Promise<NextResponse | null> {
  if (req.method !== "POST") return null;
  if (!isAdminCredentialsAuthRequest(req.nextUrl.pathname)) return null;

  return enforceIpRateLimit(req, ADMIN_LOGIN_RATE_LIMIT);
}
