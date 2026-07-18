import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { ExperienceCommentManager } from "@/components/admin/experience-comment-manager";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminExperiencesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const comments = await prisma.productExperienceComment.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true,
      locale: true,
      authorName: true,
      authorContext: true,
      authorEmail: true,
      rating: true,
      title: true,
      body: true,
      usageWeeks: true,
      source: true,
      status: true,
      createdAt: true,
      product: {
        select: { id: true, slug: true, title: true, asin: true },
      },
    },
  });

  const counts = {
    all: comments.length,
    pending: comments.filter((c) => c.status === "pending").length,
    published: comments.filter((c) => c.status === "published").length,
    rejected: comments.filter((c) => c.status === "rejected").length,
    user: comments.filter((c) => c.source === "user_submitted").length,
  };

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Nutzererfahrungen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eingereichte Erfahrungsberichte freigeben oder ablehnen
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
        <AdminNav currentPath="/admin/experiences" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Gesamt
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.all}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Warteschlange
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.pending}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Veröffentlicht
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.published}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Abgelehnt
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.rejected}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Nutzer-Einreichungen
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.user}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ExperienceCommentManager
          comments={comments}
          initialStatus={counts.pending > 0 ? "pending" : "all"}
        />
      </div>
    </div>
  );
}
