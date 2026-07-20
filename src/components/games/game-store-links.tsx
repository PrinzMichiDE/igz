import type { GameStoreLink } from "@/lib/igdb/client";

type Props = {
  title: string;
  links: GameStoreLink[];
  emptyLabel?: string;
};

const ACCENT: Record<string, string> = {
  steam: "border-[#1b2838] bg-[#1b2838] text-white hover:bg-[#2a475e]",
  ubisoft: "border-[#000] bg-black text-white hover:bg-zinc-800",
  epic: "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700",
  gog: "border-[#86328a] bg-[#86328a] text-white hover:bg-[#9b3ea0]",
  xbox: "border-[#107c10] bg-[#107c10] text-white hover:bg-[#0e6b0e]",
  playstation: "border-[#003791] bg-[#003791] text-white hover:bg-[#00286a]",
  nintendo: "border-[#e60012] bg-[#e60012] text-white hover:bg-[#c4000f]",
  ea: "border-[#ff4747] bg-[#ff4747] text-white hover:bg-[#e03e3e]",
  battlenet: "border-[#00aeff] bg-[#00aeff] text-zinc-950 hover:bg-[#33beff]",
  official: "border-border bg-surface text-primary hover:border-secondary",
};

export function GameStoreLinks({ title, links, emptyLabel }: Props) {
  if (!links.length) {
    return emptyLabel ? (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    ) : null;
  }

  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold text-primary">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={`${link.key}-${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              ACCENT[link.key] || ACCENT.official
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}
