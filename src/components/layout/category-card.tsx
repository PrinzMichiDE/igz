import Image from "next/image";
import Link from "next/link";
import { resolveCategoryImageSrc } from "@/lib/category-image-src";

type Props = {
  href: string;
  title: string;
  description?: string | null;
  count?: number;
  countLabel?: string;
  slug?: string;
  imageUrl?: string | null;
  categoryId?: string;
  imageMimeType?: string | null;
};

export function CategoryCard({
  href,
  title,
  description,
  count,
  countLabel,
  slug,
  imageUrl,
  categoryId,
  imageMimeType,
}: Props) {
  const imageSrc = resolveCategoryImageSrc({
    id: categoryId,
    slug,
    imageUrl,
    imageMimeType,
  });

  return (
    <Link href={href} className="igz-card igz-card-hover group block overflow-hidden">
      <span className="relative block aspect-[16/9] w-full bg-surface-muted">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover transition group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
      </span>
      <span className="block p-6">
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
      </span>
    </Link>
  );
}
