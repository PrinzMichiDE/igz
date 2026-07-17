import Link from "next/link";
import {
  Gamepad2,
  Headphones,
  Laptop,
  Monitor,
  Smartphone,
  Speaker,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  laptop: Laptop,
  laptops: Laptop,
  smartphone: Smartphone,
  smartphones: Smartphone,
  gaming: Gamepad2,
  kopfhoerer: Headphones,
  headphones: Headphones,
  monitor: Monitor,
  audio: Speaker,
};

function resolveIcon(slug: string, title: string): LucideIcon {
  const key = slug.toLowerCase();
  for (const [needle, icon] of Object.entries(iconMap)) {
    if (key.includes(needle) || title.toLowerCase().includes(needle)) {
      return icon;
    }
  }
  return Monitor;
}

type Props = {
  href: string;
  title: string;
  slug?: string;
};

export function CategoryIconCard({ href, title, slug = "" }: Props) {
  const Icon = resolveIcon(slug, title);

  return (
    <Link
      href={href}
      className="igz-card igz-card-hover group flex flex-col items-center gap-4 px-4 py-6 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-muted text-secondary transition group-hover:bg-secondary group-hover:text-white">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <span className="font-display text-sm font-semibold text-foreground">
        {title}
      </span>
    </Link>
  );
}
