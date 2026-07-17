import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  src: string;
  alt: string;
  overlayLabel: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  aspectClassName?: string;
};

export function AmazonImageLink({
  href,
  src,
  alt,
  overlayLabel,
  className,
  imageClassName,
  sizes = "100vw",
  priority = false,
  aspectClassName = "relative aspect-[16/9] w-full",
}: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      className={cn(
        "group relative block overflow-hidden rounded-xl border border-border bg-surface-muted transition hover:border-amazon/50 hover:shadow-md",
        className,
      )}
      aria-label={overlayLabel}
    >
      <div className={aspectClassName}>
        <Image
          src={src}
          alt={alt}
          fill
          className={cn("object-contain p-6 transition group-hover:scale-[1.02]", imageClassName)}
          sizes={sizes}
          unoptimized
          priority={priority}
        />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-amazon-dark/90 via-amazon-dark/60 to-transparent px-4 py-4 pt-10 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          <ShoppingCart className="h-4 w-4 text-amazon" aria-hidden />
          <span className="text-sm font-semibold text-white">{overlayLabel}</span>
        </div>
      </div>
      <div className="absolute top-3 right-3 rounded-md bg-amazon px-2.5 py-1 text-[11px] font-bold text-amazon-dark shadow-sm md:hidden">
        Amazon
      </div>
    </a>
  );
}
