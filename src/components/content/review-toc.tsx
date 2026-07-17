type Section = {
  id: string;
  label: string;
};

type Props = {
  title: string;
  sections: Section[];
  activeId?: string;
};

export function ReviewToc({ title, sections, activeId }: Props) {
  return (
    <aside className="igz-card p-5">
      <h2 className="text-xs font-semibold tracking-[0.14em] text-muted uppercase">
        {title}
      </h2>
      <nav className="mt-4 space-y-1">
        {sections.map((section) => {
          const isActive = section.id === activeId;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={
                isActive
                  ? "flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2 text-sm font-semibold text-secondary"
                  : "block rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-surface-muted hover:text-primary"
              }
            >
              {isActive ? (
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              ) : null}
              {section.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
