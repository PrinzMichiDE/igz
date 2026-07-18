"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanBarcode } from "lucide-react";

type Props = {
  href: string;
  label: string;
};

/** Mobile-first floating action button to open the in-store barcode scanner. */
export function ScannerFab({ href, label }: Props) {
  const pathname = usePathname();
  if (pathname?.includes("/scanner")) return null;

  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/30 transition hover:brightness-110 md:bottom-6"
    >
      <ScanBarcode className="h-5 w-5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
