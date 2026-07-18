type TocItem = {
  id: string;
  label: string;
};

type Props = {
  title: string;
  items: TocItem[];
};

export function ArticleToc({ title, items }: Props) {
  if (!items.length) return null;

  return (
    <aside className="mb-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="mb-3 text-sm font-semibold text-zinc-900">{title}</p>
      <ol className="space-y-2 text-sm">
        {items.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="text-blue-700 hover:underline">
              {index + 1}. {item.label}
            </a>
          </li>
        ))}
      </ol>
    </aside>
  );
}
