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

export async function listRecentAdminAuditLogs(options?: {
  entityType?: string;
  limit?: number;
}) {
  const limit = options?.limit ?? 20;
  return prisma.adminAuditLog.findMany({
    where: options?.entityType
      ? { entityType: options.entityType }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorEmail: true,
      detailsJson: true,
      createdAt: true,
    },
  });
}
