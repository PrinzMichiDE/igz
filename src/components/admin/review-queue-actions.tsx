"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ArticleRow = {
  id: string;
  title: string;
  type: string;
  locale: string;
  status: string;
  slug?: string;
  product?: { slug: string } | null;
  category?: { slug: string } | null;
};

function previewHref(article: ArticleRow) {
  if (article.type === "review" && article.product?.slug) {
    return `/${article.locale}/produkt/${article.product.slug}`;
  }
  if (article.type === "buying_guide" && article.category?.slug) {
    return `/${article.locale}/kategorie/${article.category.slug}/kaufberatung`;
  }
  if (article.type === "advice_guide" && article.slug) {
    return `/${article.locale}/ratgeber/${article.slug}`;
  }
  if (article.category?.slug) {
    return `/${article.locale}/kategorie/${article.category.slug}`;
  }
  return `/${article.locale}`;
}

export function ReviewQueueActions({ articles }: { articles: ArticleRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function publish(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (!res.ok) throw new Error("Freigabe fehlgeschlagen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, title: string) {
    if (!window.confirm(`„${title}“ wirklich löschen?`)) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setBusyId(null);
    }
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Artikel in der Warteschlange.{" "}
        <Link href="/admin/articles" className="text-secondary hover:underline">
          Alle Tests verwalten →
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {articles.map((article) => (
          <li
            key={article.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-primary">{article.title}</p>
              <p className="text-xs text-muted">
                {article.type} · {article.locale} · {article.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === article.id}
                onClick={() => publish(article.id)}
                className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                Freigeben
              </button>
              <Link
                href={previewHref(article)}
                target="_blank"
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary"
              >
                Vorschau
              </Link>
              <button
                type="button"
                disabled={busyId === article.id}
                onClick={() => remove(article.id, article.title)}
                className="rounded-lg border border-danger/40 px-3 py-2 text-xs font-semibold text-danger disabled:opacity-50"
              >
                Löschen
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        <Link href="/admin/articles" className="text-secondary hover:underline">
          Alle Tests & Artikel verwalten →
        </Link>
      </p>
    </div>
  );
}
