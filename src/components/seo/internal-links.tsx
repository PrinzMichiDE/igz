import Link from "next/link";

type LinkItem = {
  href: string;
  title: string;
  description?: string | null;
};

type Props = {
  title: string;
  items: LinkItem[];
};

export function InternalLinks({ title, items }: Props) {
  if (!items.length) return null;

  return (
    <section className="mt-12 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
      <h2 className="mb-4 text-lg font-bold text-zinc-900">{title}</h2>
      <ul className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-zinc-200 bg-white px-4 py-3 transition hover:border-blue-300 hover:shadow-sm"
            >
              <p className="text-sm font-semibold text-blue-700">{item.title}</p>
              {item.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                  {item.description}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
