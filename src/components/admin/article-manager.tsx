"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type AdminArticleRow = {
  id: string;
  title: string;
  slug: string;
  type: string;
  locale: string;
  status: string;
  publishedAt: string | Date | null;
  updatedAt: string | Date;
  product?: { id: string; slug: string; title: string; asin: string } | null;
  category?: {
    id: string;
    slug: string;
    nameDe: string;
    nameEn: string;
  } | null;
};

function previewHref(article: AdminArticleRow) {
  if (article.type === "review" && article.product?.slug) {
    return `/${article.locale}/produkt/${article.product.slug}`;
  }
  if (article.type === "buying_guide" && article.category?.slug) {
    return `/${article.locale}/kategorie/${article.category.slug}/kaufberatung`;
  }
  if (article.category?.slug) {
    return `/${article.locale}/kategorie/${article.category.slug}`;
  }
  return `/${article.locale}`;
}

function statusLabel(status: string) {
  if (status === "published") return "Veröffentlicht";
  if (status === "needs_review") return "Warteschlange";
  if (status === "draft") return "Entwurf";
  return status;
}

type Props = {
  articles: AdminArticleRow[];
  initialType?: string;
  initialStatus?: string;
};

export function ArticleManager({
  articles,
  initialType = "review",
  initialStatus = "all",
}: Props) {
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [status, setStatus] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (type !== "all" && article.type !== type) return false;
      if (status !== "all" && article.status !== status) return false;
      if (!q) return true;
      return (
        article.title.toLowerCase().includes(q) ||
        article.slug.toLowerCase().includes(q) ||
        article.product?.title.toLowerCase().includes(q) ||
        article.product?.asin.toLowerCase().includes(q) ||
        false
      );
    });
  }, [articles, type, status, query]);

  async function patchStatus(id: string, nextStatus: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
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

  async function removeArticle(article: AdminArticleRow) {
    const ok = window.confirm(
      `Test/Artikel wirklich löschen?\n\n„${article.title}“\n\nDas kann nicht rückgängig gemacht werden.`,
    );
    if (!ok) return;

    setBusyId(article.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
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

  async function removeProduct(article: AdminArticleRow) {
    if (!article.product?.id) return;
    const ok = window.confirm(
      `Produkt inkl. aller Tests löschen?\n\n„${article.product.title}“ (${article.product.asin})\n\nAlle zugehörigen Artikel und Kommentare werden mitgelöscht.`,
    );
    if (!ok) return;

    setBusyId(article.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${article.product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Produkt löschen fehlgeschlagen");
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
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 md:flex-row md:flex-wrap md:items-end">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Typ
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
          >
            <option value="all">Alle</option>
            <option value="review">Tests / Reviews</option>
            <option value="comparison">Vergleiche</option>
            <option value="buying_guide">Kaufberatungen</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
          >
            <option value="all">Alle</option>
            <option value="published">Veröffentlicht</option>
            <option value="needs_review">Warteschlange</option>
            <option value="draft">Entwurf</option>
          </select>
        </label>
        <label className="min-w-[220px] flex-1 text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Suche
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titel, Slug, ASIN…"
            className="h-10 w-full rounded-lg border border-border px-3 text-sm"
          />
        </label>
        <p className="text-sm text-muted-foreground md:ml-auto">
          {filtered.length} Treffer
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Artikel gefunden.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {filtered.map((article) => {
            const busy = busyId === article.id;
            return (
              <li
                key={article.id}
                className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-primary">{article.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {article.type} · {article.locale.toUpperCase()} ·{" "}
                    {statusLabel(article.status)}
                    {article.product
                      ? ` · ${article.product.asin}`
                      : article.category
                        ? ` · ${article.category.slug}`
                        : ""}
                  </p>
                  {article.product ? (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      Produkt: {article.product.title}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={previewHref(article)}
                    target="_blank"
                    className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary"
                  >
                    Vorschau
                  </Link>
                  {article.status !== "published" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => patchStatus(article.id, "published")}
                      className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Veröffentlichen
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => patchStatus(article.id, "draft")}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary disabled:opacity-50"
                    >
                      Zurückziehen
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeArticle(article)}
                    className="rounded-lg border border-danger/40 px-3 py-2 text-xs font-semibold text-danger disabled:opacity-50"
                  >
                    Test löschen
                  </button>
                  {article.product ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeProduct(article)}
                      className="rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Produkt löschen
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
