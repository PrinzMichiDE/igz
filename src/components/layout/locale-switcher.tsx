"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: string) {
    if (!pathname) return;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || `/${next}`);
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 text-xs font-semibold">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={
            l === locale
              ? "rounded-md bg-zinc-900 px-2.5 py-1 text-white"
              : "rounded-md px-2.5 py-1 text-zinc-600 hover:text-zinc-900"
          }
          aria-pressed={l === locale}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
