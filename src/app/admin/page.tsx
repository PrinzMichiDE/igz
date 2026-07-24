import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReviewQueueActions } from "@/components/admin/review-queue-actions";
import { auth, signOut } from "@/lib/auth";
import { getAffiliateAnalytics } from "@/lib/affiliate-analytics";
import { getQuotaStatus } from "@/lib/amazon/quota";
import { countProductsMissingReviews } from "@/lib/content-backfill";
import { prisma } from "@/lib/db/prisma";
import {
  countSucceededAdviceGuidesToday,
  DAILY_NEW_ADVICE_GUIDE_TARGET,
} from "@/lib/ratgeber/daily-quota";
import { countRemainingAdviceGuideTopics } from "@/lib/ratgeber/select-topic";
import {
  countSucceededReviewsToday,
  DAILY_NEW_REVIEW_TARGET,
} from "@/lib/review-daily-quota";
import {
  aggregateJobRunCounts,
  countRecentFailedJobs,
} from "@/lib/jobs/admin-stats";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const [
    quota,
    analytics,
    recentJobs,
    pendingArticles,
    reviewCount,
    publishedReviewCount,
    missingReviewCount,
    pendingTestRequests,
    reviewsToday,
    adviceGuidesToday,
    adviceGuidesPublished,
    adviceTopicsRemaining,
    activePriceAlerts,
    jobStatusRows,
    recentFailedJobs,
  ] = await Promise.all([
    getQuotaStatus(),
    getAffiliateAnalytics(30),
    prisma.jobRun.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.article.findMany({
      where: { status: "needs_review" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        locale: true,
        status: true,
        product: { select: { slug: true } },
        category: { select: { slug: true } },
      },
    }),
    prisma.article.count({ where: { type: "review" } }),
    prisma.article.count({ where: { type: "review", status: "published" } }),
    countProductsMissingReviews({ locale: "de" }),
    prisma.productTestRequest.count({ where: { status: "pending" } }),
    countSucceededReviewsToday(),
    countSucceededAdviceGuidesToday(),
    prisma.article.count({
      where: { type: "advice_guide", status: "published" },
    }),
    countRemainingAdviceGuideTopics("de"),
    prisma.priceAlert.count({ where: { status: "active" } }),
    prisma.jobRun.findMany({ select: { status: true } }),
    prisma.jobRun.findMany({
      where: { status: "failed" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { status: true, createdAt: true },
    }),
  ]);

  const jobCounts = aggregateJobRunCounts(jobStatusRows);
  const failedJobsLast24h = countRecentFailedJobs(recentFailedJobs);

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            IGZ Betrieb & Redaktion
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/admin/login" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary"
          >
            Abmelden
          </button>
        </form>
      </div>

      <div className="mt-6">
        <AdminNav currentPath="/admin" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/affiliate"
          className="igz-card igz-card-hover block p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Affiliate-Klicks (30T)
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {analytics.totalClicks}
          </p>
          <p className="mt-2 text-xs text-secondary">Analytics anzeigen →</p>
        </Link>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            RapidAPI Quota
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {quota.used}/{quota.softLimit}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Review-Queue
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {pendingArticles.length}
          </p>
        </div>
        <Link href="/admin/articles" className="igz-card igz-card-hover block p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Tests veröffentlicht
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {publishedReviewCount}/{reviewCount}
          </p>
          <p className="mt-2 text-xs text-secondary">Tests verwalten →</p>
        </Link>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ohne Testbericht (DE)
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {missingReviewCount}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Automatischer Nachzug 01:30 / 07:00 / 13:00 UTC, über alle Kategorien
          </p>
        </div>
        <Link
          href="/admin/test-requests"
          className="igz-card igz-card-hover block p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Offene Testanfragen
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {pendingTestRequests}
          </p>
          <p className="mt-2 text-xs text-secondary">Anfragen prüfen →</p>
        </Link>
        <Link
          href="/admin/price-alerts"
          className="igz-card igz-card-hover block p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Aktive Preisalarme
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {activePriceAlerts}
          </p>
          <p className="mt-2 text-xs text-secondary">Alarme verwalten →</p>
        </Link>
        <Link
          href="/admin/health"
          className="igz-card igz-card-hover block p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            System-Health
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            Status
          </p>
          <p className="mt-2 text-xs text-secondary">
            DB, Env, Cron-Pipelines →
          </p>
        </Link>
        <Link
          href="/admin/jobs"
          className="igz-card igz-card-hover block p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Fehlgeschlagene Jobs (24h)
          </p>
          <p
            className={`mt-2 font-display text-3xl font-bold ${failedJobsLast24h > 0 ? "text-red-600" : "text-primary"}`}
          >
            {failedJobsLast24h}
          </p>
          <p className="mt-2 text-xs text-secondary">
            {jobCounts.failed} gesamt · Jobs anzeigen →
          </p>
        </Link>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Neue Tests heute (UTC)
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {reviewsToday}/{DAILY_NEW_REVIEW_TARGET}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Tagesbudget: 3 Tests aus verschiedenen Kategorien · Cron 07:00 UTC
          </p>
        </div>
        <Link
          href="/admin/articles?type=advice_guide"
          className="igz-card igz-card-hover block p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Ratgeber heute (UTC)
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {adviceGuidesToday}/{DAILY_NEW_ADVICE_GUIDE_TARGET}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {adviceGuidesPublished} veröffentlicht · {adviceTopicsRemaining}{" "}
            Themen offen · Cron 09:00 UTC
          </p>
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-primary">
            Review-Warteschlange
          </h2>
          <Link
            href="/admin/articles"
            className="text-sm font-semibold text-secondary hover:underline"
          >
            Alle Tests & Artikel →
          </Link>
        </div>
        <div className="mt-4">
          <ReviewQueueActions articles={pendingArticles} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">
          Top Affiliate-Produkte
        </h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-4 py-3">Produkt</th>
                <th className="px-4 py-3">ASIN</th>
                <th className="px-4 py-3 text-right">Klicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {analytics.topProducts.map((row) => (
                <tr key={row.asin}>
                  <td className="px-4 py-3">{row.title}</td>
                  <td className="px-4 py-3 text-muted">{row.asin}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {row.clicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-primary">
            Letzte Jobs
          </h2>
          <Link
            href="/admin/jobs"
            className="text-sm font-semibold text-secondary hover:underline"
          >
            Alle Jobs →
          </Link>
        </div>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
          {recentJobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <span className="font-medium text-primary">{job.type}</span>
              <span className="text-muted">{job.status}</span>
              <span className="text-xs text-muted">{job.message}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
