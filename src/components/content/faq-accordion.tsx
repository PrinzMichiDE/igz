type FaqItem = { question: string; answer: string };

type Props = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: Props) {
  if (!items?.length) return null;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-zinc-200 bg-white px-4 py-3"
        >
          <summary className="cursor-pointer list-none font-medium text-zinc-900 marker:content-none">
            <span className="flex items-center justify-between gap-3">
              {item.question}
              <span className="text-zinc-400 transition group-open:rotate-45">
                +
              </span>
            </span>
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
