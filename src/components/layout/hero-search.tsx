"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Props = {
  placeholder: string;
  buttonLabel: string;
  actionHref: string;
  variant?: "hero" | "compact";
};

export function HeroSearch({
  placeholder,
  buttonLabel,
  actionHref,
  variant = "hero",
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = query.trim()
      ? `${actionHref}?q=${encodeURIComponent(query.trim())}`
      : actionHref;
    router.push(target);
  }

  if (variant === "compact") {
    return (
      <form onSubmit={onSubmit} className="hidden items-center lg:flex">
        <label className="relative">
          <span className="sr-only">{placeholder}</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="h-10 w-56 rounded-lg border border-border bg-surface pl-9 text-sm text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 xl:w-64"
          />
        </label>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:rounded-xl sm:border sm:border-border sm:bg-surface sm:p-2 sm:shadow-sm"
    >
      <label className="relative flex-1">
        <span className="sr-only">{placeholder}</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-xl border border-border bg-surface pl-12 text-base text-foreground outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 sm:border-0 sm:bg-transparent sm:shadow-none sm:focus:ring-0"
        />
      </label>
      <button
        type="submit"
        className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-secondary px-6 text-sm font-semibold text-white transition hover:bg-secondary-strong sm:h-11"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
