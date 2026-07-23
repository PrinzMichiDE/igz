import { handlers } from "@/lib/auth";
import { enforceAdminLoginRateLimit } from "@/lib/security/admin-login-rate-limit";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const limited = await enforceAdminLoginRateLimit(req);
  if (limited) return limited;
  return handlers.POST(req);
}

export const { GET } = handlers;
