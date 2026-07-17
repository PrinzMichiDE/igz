type Props = {
  text: string;
  compact?: boolean;
};

export function AffiliateDisclosure({ text, compact }: Props) {
  return (
    <aside
      className={
        compact
          ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      }
      role="note"
    >
      {text}
    </aside>
  );
}
