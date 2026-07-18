import Image from "next/image";
import Link from "next/link";
import { resolveCategoryImageSrc } from "@/lib/category-image-src";

type Props = {
  href: string;
  title: string;
  slug?: string;
  imageUrl?: string | null;
  categoryId?: string;
  imageMimeType?: string | null;
};

export function CategoryIconCard({
  href,
  title,
  slug = "",
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
    <Link
      href={href}
      className="igz-card igz-card-hover group flex flex-col overflow-hidden text-center"
    >
      <span className="relative block aspect-[4/3] w-full bg-surface-muted">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover transition group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 16vw"
          unoptimized
        />
      </span>
      <span className="px-3 py-4 font-display text-sm font-semibold text-foreground">
        {title}
      </span>
    </Link>
  );
}
