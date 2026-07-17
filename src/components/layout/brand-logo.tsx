import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  className?: string;
  showWordmark?: boolean;
};

export function BrandLogo({
  href = "/",
  className = "",
  showWordmark = true,
}: Props) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-primary-container">
        <Image
          src="/logo.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 object-contain"
        />
      </span>
      {showWordmark ? (
        <span className="font-display text-lg font-bold tracking-tight text-primary">
          IGZ
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="shrink-0">
      {content}
    </Link>
  );
}
