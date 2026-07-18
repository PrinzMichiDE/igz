"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type ArticleRow = {
  id: string;
  title: string;
  type: string;
  locale: string;
  status: string;
};

export function ReviewQueueActions({ articles }: { articles: ArticleRow[] }) {
  const router = useRouter();

  async function publish(id: string) {
    await fetch(`/api/admin/articles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "published" }),
    });
    router.refresh();
  }

  if (articles.length === 0) {
    return <p className="text-sm text-muted-foreground">Keine Artikel in der Warteschlange.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {articles.map((article) => (
        <li key={article.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-primary">{article.title}</p>
            <p className="text-xs text-muted">
              {article.type} · {article.locale} · {article.status}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => publish(article.id)}
              className="rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-white"
            >
              Freigeben
            </button>
            <Link
              href={`/${article.locale}`}
              className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-primary"
            >
              Vorschau
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
