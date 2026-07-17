import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

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

export function getCronSchedule(req: NextRequest) {
  return req.headers.get("x-vercel-cron-schedule");
}

export async function resolveCronCategory(slug: string | null) {
  if (slug) {
    return prisma.category.findUnique({ where: { slug } });
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (categories.length === 0) {
    return null;
  }

  const dayIndex =
    Math.floor(Date.now() / 86_400_000) % categories.length;

  return categories[dayIndex] ?? categories[0];
}
