import Link from "next/link";

type Props = {
  title: string;
  tags: string[];
  locale: string;
  categorySlug: string;
  hint: string;
};

export function ScenarioTags({
  title,
  tags,
  locale,
  categorySlug,
  hint,
}: Props) {
  if (tags.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-sm font-semibold text-primary">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/${locale}/kategorie/${categorySlug}?useCase=${encodeURIComponent(tag)}`}
            className="rounded-full border border-secondary/20 bg-secondary/5 px-3 py-1.5 text-sm font-medium text-secondary transition hover:bg-secondary/10"
          >
            {tag}
          </Link>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </section>
  );
}
