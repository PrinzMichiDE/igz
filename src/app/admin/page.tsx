import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { ReviewQueueActions } from "@/components/admin/review-queue-actions";
import { getAffiliateAnalytics } from "@/lib/affiliate-analytics";
import { getQuotaStatus } from "@/lib/amazon/quota";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const [quota, analytics, recentJobs, pendingArticles] = await Promise.all([
    getQuotaStatus(),
    getAffiliateAnalytics(30),
    prisma.jobRun.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.article.findMany({
      where: { status: "needs_review" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, type: true, locale: true, status: true },
    }),
  ]);

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">IGZ Betrieb & Redaktion</p>
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Affiliate-Klicks (30T)</p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">{analytics.totalClicks}</p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">RapidAPI Quota</p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {quota.used}/{quota.softLimit}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Review-Queue</p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">{pendingArticles.length}</p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Top ASIN</p>
          <p className="mt-2 truncate text-sm font-semibold text-primary">
            {analytics.topProducts[0]?.title ?? "—"}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Top Affiliate-Produkte</h2>
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
                  <td className="px-4 py-3 text-right font-semibold">{row.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Review-Warteschlange</h2>
        <div className="mt-4">
          <ReviewQueueActions articles={pendingArticles} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">Letzte Jobs</h2>
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
          {recentJobs.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <span className="font-medium text-primary">{job.type}</span>
              <span className="text-muted">{job.status}</span>
              <span className="text-xs text-muted">{job.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        API: <Link href="/api/admin/quota" className="text-secondary hover:underline">/api/admin/quota</Link>
      </p>
    </div>
  );
}
