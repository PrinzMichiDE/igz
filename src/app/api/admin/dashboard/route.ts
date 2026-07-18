import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAffiliateAnalytics } from "@/lib/affiliate-analytics";
import { getQuotaStatus } from "@/lib/amazon/quota";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const days = 30;
  const [quota, analytics, recentJobs, pendingArticles] = await Promise.all([
    getQuotaStatus(),
    getAffiliateAnalytics(days),
    prisma.jobRun.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.article.findMany({
      where: { status: "needs_review" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, type: true, locale: true, status: true },
    }),
  ]);

  return NextResponse.json({
    quota,
    analytics,
    recentJobs,
    pendingArticles,
  });
}
