import Link from "next/link";

type Props = {
  href: string;
  title: string;
  description?: string | null;
  count?: number;
};

export function CategoryCard({ href, title, description, count }: Props) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <h3 className="mb-2 text-lg font-semibold text-zinc-900 group-hover:text-blue-700">
        {title}
      </h3>
      {description ? (
        <p className="mb-3 line-clamp-3 text-sm text-zinc-600">{description}</p>
      ) : null}
      {typeof count === "number" ? (
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {count} products
        </p>
      ) : null}
    </Link>
  );
}
