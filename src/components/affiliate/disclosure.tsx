type Props = {
  text: string;
  compact?: boolean;
};

export function AffiliateDisclosure({ text, compact }: Props) {
  return (
    <aside
      className={
        compact
          ? "rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs text-muted-foreground"
          : "rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-muted-foreground"
      }
      role="note"
    >
      {text}
    </aside>
  );
}
