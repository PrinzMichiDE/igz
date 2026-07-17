import { NextRequest } from "next/server";

export function assertCronAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("CRON_SECRET is not configured");
  }

  const header = req.headers.get("authorization");
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const querySecret = req.nextUrl.searchParams.get("secret");

  if (bearer !== secret && querySecret !== secret) {
    return false;
  }
  return true;
}
