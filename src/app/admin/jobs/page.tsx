import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  ADMIN_JOB_STATUSES,
  ADMIN_JOB_TYPES,
  aggregateJobRunCounts,
  buildJobRunWhere,
  countRecentFailedJobs,
  isAdminJobStatus,
  isAdminJobType,
  normalizeJobRunPagination,
} from "@/lib/jobs/admin-stats";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>;
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "succeeded":
      return "bg-emerald-100 text-emerald-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "running":
      return "bg-blue-100 text-blue-800";
    case "skipped":
      return "bg-amber-100 text-amber-800";
    case "pending":
      return "bg-surface-muted text-muted-foreground";
    default:
      return "bg-surface-muted text-muted-foreground";
  }
}

function formatDuration(startedAt: Date | null, finishedAt: Date | null) {
  if (!startedAt || !finishedAt) return "—";
  const ms = finishedAt.getTime() - startedAt.getTime();
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`;
  return `${Math.round(ms / 60_000)} min`;
}

function formatJobType(type: string) {
  return type.replace(/_/g, " ");
}

export default async function AdminJobsPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const statusFilter =
    params.status && isAdminJobStatus(params.status)
      ? params.status
      : undefined;
  const typeFilter =
    params.type && isAdminJobType(params.type) ? params.type : undefined;
  const { page, limit, offset } = normalizeJobRunPagination({
    page: params.page,
  });

  const where = buildJobRunWhere({
    status: statusFilter,
    type: typeFilter,
  });

  const [statusRows, recentForFailures, total, jobs] = await Promise.all([
    prisma.jobRun.findMany({ select: { status: true } }),
    prisma.jobRun.findMany({
      where: { status: "failed" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { status: true, createdAt: true },
    }),
    prisma.jobRun.count({ where }),
    prisma.jobRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        type: true,
        status: true,
        message: true,
        error: true,
        requestsUsed: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
      },
    }),
  ]);

  const counts = aggregateJobRunCounts(statusRows);
  const failedLast24h = countRecentFailedJobs(recentForFailures);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function filterHref(next: { status?: string; type?: string; page?: number }) {
    const query = new URLSearchParams();
    const status = next.status ?? statusFilter;
    const type = next.type ?? typeFilter;
    if (status) query.set("status", status);
    if (type) query.set("type", type);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const qs = query.toString();
    return qs ? `/admin/jobs?${qs}` : "/admin/jobs";
  }

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Hintergrund-Jobs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cron- & Workflow-Läufe · {failedLast24h} Fehler in 24h
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary"
        >
          Zum Dashboard
        </Link>
      </div>

      <div className="mt-6">
        <AdminNav currentPath="/admin/jobs" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Erfolgreich
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.succeeded}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Fehlgeschlagen
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-red-600">
            {counts.failed}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Laufend
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.running}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Übersprungen
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.skipped}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Gesamt
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.total}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Status
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref({ status: undefined })}
            className={
              !statusFilter
                ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
            }
          >
            Alle
          </Link>
          {ADMIN_JOB_STATUSES.map((status) => (
            <Link
              key={status}
              href={filterHref({ status, page: 1 })}
              className={
                statusFilter === status
                  ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                  : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              }
            >
              {status} ({counts[status]})
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Job-Typ
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={filterHref({ type: undefined })}
            className={
              !typeFilter
                ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
            }
          >
            Alle Typen
          </Link>
          {ADMIN_JOB_TYPES.map((type) => (
            <Link
              key={type}
              href={filterHref({ type, page: 1 })}
              className={
                typeFilter === type
                  ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                  : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              }
            >
              {formatJobType(type)}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left">
            <tr>
              <th className="px-4 py-3">Zeit</th>
              <th className="px-4 py-3">Typ</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dauer</th>
              <th className="px-4 py-3">API-Calls</th>
              <th className="px-4 py-3">Meldung</th>
              <th className="px-4 py-3">Fehler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Keine Jobs
                  {statusFilter ? ` mit Status „${statusFilter}"` : ""}
                  {typeFilter ? ` vom Typ „${formatJobType(typeFilter)}"` : ""}.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                    {job.createdAt.toLocaleString("de-DE")}
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {formatJobType(job.type)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDuration(job.startedAt, job.finishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {job.requestsUsed > 0 ? job.requestsUsed : "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {job.message ?? "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-red-700">
                    {job.error ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">
            Seite {page} von {totalPages} · {total} Einträge
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={filterHref({ page: page - 1 })}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              >
                ← Zurück
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={filterHref({ page: page + 1 })}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              >
                Weiter →
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
