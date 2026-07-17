import Link from "next/link";

type Props = {
  href: string;
  title: string;
  description?: string | null;
  count?: number;
  countLabel?: string;
};

export function CategoryCard({
  href,
  title,
  description,
  count,
  countLabel,
}: Props) {
  return (
    <Link href={href} className="igz-card igz-card-hover group block p-6">
      <h3 className="font-display text-lg font-semibold text-primary group-hover:text-secondary">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {typeof count === "number" && countLabel ? (
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-muted">
          {count} {countLabel}
        </p>
      ) : null}
    </Link>
  );
}
