"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, ScanBarcode, Search, Tag, X } from "lucide-react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export type HeaderNavLink = {
  href: string;
  label: string;
};

type Props = {
  locale: string;
  links: HeaderNavLink[];
  searchPlaceholder: string;
  searchButtonLabel: string;
  searchHref: string;
  scannerLabel: string;
  dealsLabel: string;
  menuOpenLabel: string;
  menuCloseLabel: string;
};

export function SiteHeaderNav({
  locale,
  links,
  searchPlaceholder,
  searchButtonLabel,
  searchHref,
  scannerLabel,
  dealsLabel,
  menuOpenLabel,
  menuCloseLabel,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-muted hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href={searchHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-primary transition hover:border-secondary lg:hidden"
          aria-label={searchButtonLabel}
        >
          <Search className="h-4 w-4" aria-hidden />
        </Link>

        <form
          action={searchHref}
          method="get"
          className="relative hidden lg:block"
          role="search"
        >
          <span className="sr-only">{searchPlaceholder}</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            name="q"
            placeholder={searchPlaceholder}
            className="h-10 w-48 rounded-lg border border-border bg-surface pl-9 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 xl:w-56"
          />
        </form>

        <Link
          href={`/${locale}/scanner`}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-primary transition hover:border-secondary"
          aria-label={scannerLabel}
        >
          <ScanBarcode className="h-4 w-4" aria-hidden />
          <span className="hidden xl:inline">{scannerLabel}</span>
        </Link>

        <Link
          href={`/${locale}/deals`}
          className="hidden h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition hover:bg-primary-container sm:inline-flex"
        >
          <Tag className="h-4 w-4" aria-hidden />
          {dealsLabel}
        </Link>

        <div className="hidden sm:block">
          <LocaleSwitcher />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-primary lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? menuCloseLabel : menuOpenLabel}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-border bg-surface shadow-lg lg:hidden"
        >
          <div className="igz-container flex flex-col gap-1 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-primary hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={`/${locale}/scanner`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-primary hover:bg-surface-muted"
            >
              {scannerLabel}
            </Link>
            <Link
              href={`/${locale}/deals`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-3 text-sm font-semibold text-primary hover:bg-surface-muted sm:hidden"
            >
              {dealsLabel}
            </Link>
            <div className="flex items-center justify-between gap-3 border-t border-border px-3 pt-3 sm:hidden">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
