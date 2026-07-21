import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import {
  ADMIN_AUDIT_ENTITY_TYPES,
  countAdminAuditLogs,
  isAdminAuditEntityType,
  listAdminAuditLogs,
  normalizeAuditPagination,
} from "@/lib/admin/audit-log";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ entityType?: string; page?: string }>;
};

function formatDetails(details: unknown) {
  if (!details || typeof details !== "object") return null;
  try {
    return JSON.stringify(details, null, 0);
  } catch {
    return null;
  }
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const entityType =
    params.entityType && isAdminAuditEntityType(params.entityType)
      ? params.entityType
      : undefined;
  const { page, limit, offset } = normalizeAuditPagination({
    page: params.page,
  });

  const [total, logs] = await Promise.all([
    countAdminAuditLogs(entityType ? { entityType } : undefined),
    listAdminAuditLogs({
      entityType,
      limit,
      offset,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function filterHref(type?: string) {
    const query = new URLSearchParams();
    if (type) query.set("entityType", type);
    const qs = query.toString();
    return qs ? `/admin/audit?${qs}` : "/admin/audit";
  }

  function pageHref(nextPage: number) {
    const query = new URLSearchParams();
    if (entityType) query.set("entityType", entityType);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/admin/audit?${query.toString()}`;
  }

  return (
    <div className="igz-container py-10 md:py-14">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary">
          Audit-Log
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nachvollziehbare Aufzeichnung aller privilegierten Admin-Aktionen
        </p>
      </div>

      <div className="mt-6">
        <AdminNav currentPath="/admin/audit" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={filterHref()}
          className={
            !entityType
              ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
              : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
          }
        >
          Alle
        </Link>
        {ADMIN_AUDIT_ENTITY_TYPES.map((type) => (
          <Link
            key={type}
            href={filterHref(type)}
            className={
              entityType === type
                ? "rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
                : "rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
            }
          >
            {type.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-muted text-left">
            <tr>
              <th className="px-4 py-3">Zeit</th>
              <th className="px-4 py-3">Aktion</th>
              <th className="px-4 py-3">Entität</th>
              <th className="px-4 py-3">Akteur</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Noch keine Audit-Einträge
                  {entityType ? ` für „${entityType}"` : ""}.
                </td>
              </tr>
            ) : (
              logs.map((entry) => {
                const details = formatDetails(entry.detailsJson);
                return (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                      {entry.createdAt.toLocaleString("de-DE")}
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {entry.action}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <span>{entry.entityType}</span>
                      {entry.entityId ? (
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {entry.entityId.slice(0, 12)}…
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.actorEmail}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                      {details ?? "—"}
                    </td>
                  </tr>
                );
              })
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
                href={pageHref(page - 1)}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary hover:border-secondary"
              >
                ← Zurück
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
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
