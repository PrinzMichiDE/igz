import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { ArticleManager } from "@/components/admin/article-manager";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const articles = await prisma.article.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      locale: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
      product: { select: { id: true, slug: true, title: true, asin: true } },
      category: {
        select: { id: true, slug: true, nameDe: true, nameEn: true },
      },
    },
  });

  const counts = {
    all: articles.length,
    review: articles.filter((a) => a.type === "review").length,
    published: articles.filter((a) => a.status === "published").length,
    needsReview: articles.filter((a) => a.status === "needs_review").length,
  };

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Tests & Artikel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Testberichte veröffentlichen, zurückziehen oder löschen
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
        <AdminNav currentPath="/admin/articles" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Artikel gesamt
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.all}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Tests / Reviews
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.review}
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
            Warteschlange
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {counts.needsReview}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <ArticleManager
          articles={articles.map((article) => ({
            ...article,
            publishedAt: article.publishedAt?.toISOString() ?? null,
            updatedAt: article.updatedAt.toISOString(),
          }))}
          initialType="review"
          initialStatus="all"
        />
      </section>
    </div>
  );
}
