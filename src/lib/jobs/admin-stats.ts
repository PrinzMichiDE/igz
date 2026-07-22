import type { JobStatus, JobType } from "@prisma/client";

export type JobRunStatusCounts = {
  pending: number;
  running: number;
  succeeded: number;
  failed: number;
  skipped: number;
  total: number;
};

const STATUS_KEYS: JobStatus[] = [
  "pending",
  "running",
  "succeeded",
  "failed",
  "skipped",
];

export const ADMIN_JOB_TYPES: JobType[] = [
  "sync_search",
  "sync_details",
  "generate_review",
  "generate_comparison",
  "generate_comments",
  "generate_buying_guide",
  "generate_tech_profile",
  "generate_advice_guide",
  "generate_game_review",
];

export const ADMIN_JOB_STATUSES: JobStatus[] = [...STATUS_KEYS];

export function aggregateJobRunCounts(
  rows: { status: JobStatus }[],
): JobRunStatusCounts {
  const counts: JobRunStatusCounts = {
    pending: 0,
    running: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    total: rows.length,
  };

  for (const row of rows) {
    switch (row.status) {
      case "pending":
        counts.pending += 1;
        break;
      case "running":
        counts.running += 1;
        break;
      case "succeeded":
        counts.succeeded += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      case "skipped":
        counts.skipped += 1;
        break;
      default: {
        const _exhaustive: never = row.status;
        throw new Error(`Unknown job status: ${_exhaustive}`);
      }
    }
  }

  return counts;
}

export function isAdminJobType(value: string): value is JobType {
  return (ADMIN_JOB_TYPES as readonly string[]).includes(value);
}

export function isAdminJobStatus(value: string): value is JobStatus {
  return STATUS_KEYS.includes(value as JobStatus);
}

export function normalizeJobRunPagination(input: {
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

export type JobRunListFilter = {
  status?: JobStatus;
  type?: JobType;
  limit?: number;
  offset?: number;
};

export function buildJobRunWhere(filter?: Pick<JobRunListFilter, "status" | "type">) {
  if (!filter?.status && !filter?.type) return undefined;
  return {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.type ? { type: filter.type } : {}),
  };
}

export function countRecentFailedJobs(
  rows: { status: JobStatus; createdAt: Date }[],
  windowHours = 24,
  now = new Date(),
): number {
  const cutoff = now.getTime() - windowHours * 60 * 60 * 1000;
  return rows.filter(
    (row) => row.status === "failed" && row.createdAt.getTime() >= cutoff,
  ).length;
}
