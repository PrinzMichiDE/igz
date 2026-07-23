import { prisma } from "@/lib/db/prisma";

export type AdminAuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  actorEmail: string;
  details?: Record<string, unknown> | null;
};

export async function logAdminAction(input: AdminAuditInput) {
  return prisma.adminAuditLog.create({
    data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      actorEmail: input.actorEmail,
      detailsJson: input.details ?? undefined,
    },
  });
}

export type AdminAuditLogFilter = {
  entityType?: string;
  action?: string;
  limit?: number;
  offset?: number;
};

const auditLogSelect = {
  id: true,
  action: true,
  entityType: true,
  entityId: true,
  actorEmail: true,
  detailsJson: true,
  createdAt: true,
} as const;

function buildAuditLogWhere(filter?: Pick<AdminAuditLogFilter, "entityType" | "action">) {
  if (!filter?.entityType && !filter?.action) return undefined;
  return {
    ...(filter.entityType ? { entityType: filter.entityType } : {}),
    ...(filter.action ? { action: filter.action } : {}),
  };
}

export function normalizeAuditPagination(input: {
  page?: string;
  limit?: string;
}) {
  const page = Math.max(1, Number.parseInt(input.page ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(10, Number.parseInt(input.limit ?? "50", 10) || 50),
  );
  return { page, limit, offset: (page - 1) * limit };
}

export const ADMIN_AUDIT_ENTITY_TYPES = [
  "auth",
  "price_alert",
  "article",
  "product",
  "experience_comment",
  "product_test_request",
  "game_review",
] as const;

export function isAdminAuditEntityType(
  value: string,
): value is (typeof ADMIN_AUDIT_ENTITY_TYPES)[number] {
  return (ADMIN_AUDIT_ENTITY_TYPES as readonly string[]).includes(value);
}

export async function listAdminAuditLogs(options?: AdminAuditLogFilter) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  return prisma.adminAuditLog.findMany({
    where: buildAuditLogWhere(options),
    orderBy: { createdAt: "desc" },
    skip: offset,
    take: limit,
    select: auditLogSelect,
  });
}

export async function countAdminAuditLogs(
  filter?: Pick<AdminAuditLogFilter, "entityType" | "action">,
) {
  return prisma.adminAuditLog.count({ where: buildAuditLogWhere(filter) });
}

/** @deprecated Use listAdminAuditLogs */
export async function listRecentAdminAuditLogs(options?: {
  entityType?: string;
  limit?: number;
}) {
  return listAdminAuditLogs({
    entityType: options?.entityType,
    limit: options?.limit ?? 20,
  });
}
