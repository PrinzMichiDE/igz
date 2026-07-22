import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import {
  buildJobRunWhere,
  isAdminJobStatus,
  isAdminJobType,
  normalizeJobRunPagination,
} from "@/lib/jobs/admin-stats";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jobRunSelect = {
  id: true,
  type: true,
  status: true,
  message: true,
  error: true,
  requestsUsed: true,
  metricsJson: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
} as const;

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusParam = req.nextUrl.searchParams.get("status");
  const typeParam = req.nextUrl.searchParams.get("type");
  const status =
    statusParam && isAdminJobStatus(statusParam) ? statusParam : undefined;
  const type = typeParam && isAdminJobType(typeParam) ? typeParam : undefined;

  const { page, limit, offset } = normalizeJobRunPagination({
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });

  const where = buildJobRunWhere({ status, type });
  const [total, jobs] = await Promise.all([
    prisma.jobRun.count({ where }),
    prisma.jobRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: jobRunSelect,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    limit,
    jobs: jobs.map((job) => ({
      ...job,
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
    })),
  });
}
