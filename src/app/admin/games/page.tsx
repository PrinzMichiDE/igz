import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminGameReviewForm } from "@/components/admin/admin-game-review-form";
import { AdminNav } from "@/components/admin/admin-nav";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import {
  countSucceededGameReviewsToday,
  DAILY_NEW_GAME_REVIEW_TARGET,
} from "@/lib/games/daily-quota";
import { igdbConfigured } from "@/lib/igdb/client";

export const dynamic = "force-dynamic";

export default async function AdminGamesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const [today, published, games, recent] = await Promise.all([
    countSucceededGameReviewsToday(),
    prisma.gameReview.count({ where: { status: "published" } }),
    prisma.game.count(),
    prisma.gameReview.findMany({
      where: { status: "published" },
      include: { game: { select: { name: true, slug: true, igdbId: true } } },
      orderBy: { publishedAt: "desc" },
      take: 15,
    }),
  ]);

  return (
    <div className="igz-container py-10 md:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Videospiel-Reviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            IGDB-Daten · KI-Reviews · {DAILY_NEW_GAME_REVIEW_TARGET}/Tag
          </p>
        </div>
        <Link
          href="/de/spiele"
          className="text-sm font-semibold text-secondary hover:underline"
        >
          Öffentliche Liste →
        </Link>
      </div>

      <div className="mt-6">
        <AdminNav currentPath="/admin/games" />
      </div>

      {!igdbConfigured() ? (
        <p className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          IGDB ist nicht konfiguriert. Setze{" "}
          <code className="font-mono">IGDB_CLIENT_ID</code> und{" "}
          <code className="font-mono">IGDB_CLIENT_SECRET</code> (Twitch App) in
          den Vercel-Env-Vars.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Heute (UTC)
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {today}/{DAILY_NEW_GAME_REVIEW_TARGET}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Reviews live
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {published}
          </p>
        </div>
        <div className="igz-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Spiele in DB
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {games}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AdminGameReviewForm
          labels={{
            title: "Review per IGDB-ID erzeugen",
            helper:
              "IGDB-ID aus der URL https://www.igdb.com/games/... (API-ID) eintragen. Daten + Review werden sofort erzeugt.",
            igdbId: "IGDB ID",
            submit: "Review erstellen",
            submitting: "Wird generiert…",
            success: "Fertig",
            error: "Generierung fehlgeschlagen",
            openReview: "Review öffnen",
          }}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-primary">
          Zuletzt veröffentlicht
        </h2>
        <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
          {recent.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Noch keine Reviews.</p>
          ) : (
            recent.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-semibold text-primary">{item.game.name}</p>
                  <p className="text-xs text-muted">
                    IGDB {item.game.igdbId} · {item.locale.toUpperCase()}
                    {typeof item.overallScore === "number"
                      ? ` · Score ${item.overallScore.toFixed(1)}`
                      : ""}
                  </p>
                </div>
                <Link
                  href={`/${item.locale}/spiele/${item.game.slug}`}
                  className="font-semibold text-secondary hover:underline"
                >
                  Ansehen →
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
