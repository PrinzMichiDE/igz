type Comment = {
  id: string;
  authorName: string;
  authorContext?: string | null;
  rating: number;
  title?: string | null;
  body: string;
  usageWeeks?: number | null;
};

type Props = {
  title: string;
  disclaimer: string;
  weeksLabel: string;
  emptyLabel: string;
  comments: Comment[];
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} / 5`} className="text-amber-500">
      {"★".repeat(Math.max(0, Math.min(5, rating)))}
      <span className="text-zinc-300">
        {"★".repeat(Math.max(0, 5 - Math.min(5, rating)))}
      </span>
    </span>
  );
}

export function UserExperienceComments({
  title,
  disclaimer,
  weeksLabel,
  emptyLabel,
  comments,
}: Props) {
  return (
    <section id="nutzererfahrungen" className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">{disclaimer}</p>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-zinc-600">{emptyLabel}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {comment.authorName}
                  </p>
                  {comment.authorContext ? (
                    <p className="text-xs text-zinc-500">
                      {comment.authorContext}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <Stars rating={comment.rating} />
                  {comment.usageWeeks ? (
                    <p className="mt-1">
                      {comment.usageWeeks} {weeksLabel}
                    </p>
                  ) : null}
                </div>
              </div>
              {comment.title ? (
                <h3 className="mb-2 text-sm font-semibold text-zinc-800">
                  {comment.title}
                </h3>
              ) : null}
              <p className="text-sm leading-relaxed text-zinc-700">
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
