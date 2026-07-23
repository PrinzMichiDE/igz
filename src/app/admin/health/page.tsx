import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { auth } from "@/lib/auth";
import { collectSystemHealthReport } from "@/lib/admin/collect-system-health";
import {
  statusBadgeClass,
  statusLabel,
} from "@/lib/admin/system-health";

export const dynamic = "force-dynamic";

function formatLatency(ms: number | null) {
  if (ms === null) return "—";
  return `${ms} ms`;
}

export default async function AdminHealthPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const report = await collectSystemHealthReport();

  const envByCategory = {
    core: report.envChecks.filter((row) => row.category === "core"),
    cron: report.envChecks.filter((row) => row.category === "cron"),
    integrations: report.envChecks.filter((row) => row.category === "integrations"),
    optional: report.envChecks.filter((row) => row.category === "optional"),
  };

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            System-Health
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Betriebsstatus · geprüft{" "}
            {new Date(report.checkedAt).toLocaleString("de-DE")}
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
        <AdminNav currentPath="/admin/health" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Gesamtstatus
          </p>
          <p className="mt-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(report.overall)}`}
            >
              {statusLabel(report.overall)}
            </span>
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Postgres
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">
            {formatLatency(report.database.latencyMs)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {report.database.candidateCount} URL-Kandidat
            {report.database.candidateCount === 1 ? "" : "en"}
            {report.database.error ? ` · ${report.database.error}` : ""}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Redis
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-primary">
            {report.redis.configured
              ? formatLatency(report.redis.latencyMs)
              : "Nicht konfiguriert"}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {report.redis.error ?? "Locks & Rate-Limits"}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Cron-Auth
          </p>
          <p className="mt-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusBadgeClass(report.cronAuth.status)}`}
            >
              {statusLabel(report.cronAuth.status)}
            </span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {report.cronAuth.message}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">
          Laufzeit
        </h2>
        <dl className="mt-4 grid gap-3 rounded-xl border border-border bg-surface p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">NODE_ENV</dt>
            <dd className="font-medium text-primary">{report.runtime.nodeEnv}</dd>
          </div>
          <div>
            <dt className="text-muted">Vercel</dt>
            <dd className="font-medium text-primary">
              {report.runtime.vercel ? "Ja" : "Nein"}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Region</dt>
            <dd className="font-medium text-primary">
              {report.runtime.region ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">
          Cron-Pipelines
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-4 py-3">Pipeline</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Letzter Erfolg</th>
                <th className="px-4 py-3">Hinweis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.cronPipelines.map((pipeline) => (
                <tr key={pipeline.id}>
                  <td className="px-4 py-3 font-medium text-primary">
                    {pipeline.label}
                  </td>
                  <td className="px-4 py-3 text-muted">{pipeline.schedule}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(pipeline.status)}`}
                    >
                      {statusLabel(pipeline.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {pipeline.lastSuccessAt
                      ? new Date(pipeline.lastSuccessAt).toLocaleString("de-DE")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {pipeline.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(
        [
          ["Kern", envByCategory.core],
          ["Cron & Workflows", envByCategory.cron],
          ["Integrationen", envByCategory.integrations],
          ["Optional", envByCategory.optional],
        ] as const
      ).map(([title, rows]) => (
        <section key={title} className="mt-10">
          <h2 className="font-display text-xl font-semibold text-primary">
            Umgebungsvariablen · {title}
          </h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-muted text-left">
                <tr>
                  <th className="px-4 py-3">Variable</th>
                  <th className="px-4 py-3">Pflicht</th>
                  <th className="px-4 py-3">Gesetzt</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-primary">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {row.required ? "Ja" : "Nein"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {row.present ? "Ja" : "Nein"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
