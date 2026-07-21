import { NextRequest, NextResponse } from "next/server";
import {
  countAdminAuditLogs,
  isAdminAuditEntityType,
  listAdminAuditLogs,
  normalizeAuditPagination,
} from "@/lib/admin/audit-log";
import { requireAdminSession } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entityTypeParam = req.nextUrl.searchParams.get("entityType");
  const entityType =
    entityTypeParam && isAdminAuditEntityType(entityTypeParam)
      ? entityTypeParam
      : undefined;

  const { page, limit, offset } = normalizeAuditPagination({
    page: req.nextUrl.searchParams.get("page") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });

  const filter = entityType ? { entityType } : undefined;
  const [total, logs] = await Promise.all([
    countAdminAuditLogs(filter),
    listAdminAuditLogs({ ...filter, limit, offset }),
  ]);

  return NextResponse.json({
    total,
    page,
    limit,
    logs: logs.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    })),
  });
}
