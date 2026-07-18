"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type AdminExperienceCommentRow = {
  id: string;
  locale: string;
  authorName: string;
  authorContext: string | null;
  authorEmail: string | null;
  rating: number;
  title: string | null;
  body: string;
  usageWeeks: number | null;
  source: string;
  status: string;
  createdAt: string | Date;
  product: { id: string; slug: string; title: string; asin: string };
};

function statusLabel(status: string) {
  if (status === "published") return "Veröffentlicht";
  if (status === "pending") return "Warteschlange";
  if (status === "rejected") return "Abgelehnt";
  return status;
}

type Props = {
  comments: AdminExperienceCommentRow[];
  initialStatus?: string;
};

export function ExperienceCommentManager({
  comments,
  initialStatus = "pending",
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return comments.filter((comment) => {
      if (status !== "all" && comment.status !== status) return false;
      if (!q) return true;
      return (
        comment.authorName.toLowerCase().includes(q) ||
        comment.body.toLowerCase().includes(q) ||
        comment.title?.toLowerCase().includes(q) ||
        comment.product.title.toLowerCase().includes(q) ||
        comment.product.asin.toLowerCase().includes(q) ||
        false
      );
    });
  }, [comments, status, query]);

  async function patchStatus(id: string, nextStatus: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/experience-comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Status konnte nicht geändert werden");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusyId(null);
    }
  }

  async function removeComment(comment: AdminExperienceCommentRow) {
    if (
      !window.confirm(
        `Bericht von „${comment.authorName}“ wirklich löschen?`,
      )
    ) {
      return;
    }
    setBusyId(comment.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/experience-comments/${comment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Löschen fehlgeschlagen");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="pending">Warteschlange</option>
          <option value="published">Veröffentlicht</option>
          <option value="rejected">Abgelehnt</option>
          <option value="all">Alle</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche Autor, Text, ASIN…"
          className="min-w-[220px] flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          {filtered.length} Treffer
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Berichte gefunden.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((comment) => (
            <article key={comment.id} className="igz-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-primary">
                      {comment.authorName}
                    </p>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {statusLabel(comment.status)}
                    </span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {comment.source === "user_submitted"
                        ? "Nutzer"
                        : comment.source}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {comment.locale.toUpperCase()} · {comment.rating}★
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <Link
                      href={`/${comment.locale}/produkt/${comment.product.slug}`}
                      className="font-medium text-secondary hover:underline"
                    >
                      {comment.product.title}
                    </Link>
                    {" · "}
                    {comment.product.asin}
                    {comment.authorEmail ? ` · ${comment.authorEmail}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleString("de-DE")}
                </p>
              </div>

              {comment.title ? (
                <h3 className="mt-3 text-sm font-semibold text-primary">
                  {comment.title}
                </h3>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {comment.body}
              </p>
              {comment.authorContext || comment.usageWeeks ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {comment.authorContext}
                  {comment.authorContext && comment.usageWeeks ? " · " : ""}
                  {comment.usageWeeks
                    ? `${comment.usageWeeks} Wochen Nutzung`
                    : ""}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {comment.status !== "published" ? (
                  <button
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => patchStatus(comment.id, "published")}
                    className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Freigeben
                  </button>
                ) : null}
                {comment.status !== "rejected" ? (
                  <button
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => patchStatus(comment.id, "rejected")}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-60"
                  >
                    Ablehnen
                  </button>
                ) : null}
                {comment.status !== "pending" ? (
                  <button
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => patchStatus(comment.id, "pending")}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary disabled:opacity-60"
                  >
                    Zurück in Warteschlange
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busyId === comment.id}
                  onClick={() => removeComment(comment)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                >
                  Löschen
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
