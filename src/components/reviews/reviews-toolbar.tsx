type CategoryOption = {
  slug: string;
  label: string;
};

type Props = {
  actionHref: string;
  categories: CategoryOption[];
  values: {
    q: string;
    category: string;
    minScore: string;
    sort: string;
  };
  labels: {
    search: string;
    searchPlaceholder: string;
    category: string;
    allCategories: string;
    minScore: string;
    anyScore: string;
    sort: string;
    apply: string;
    reset: string;
    sortNewest: string;
    sortOldest: string;
    sortScoreDesc: string;
    sortScoreAsc: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortRatingDesc: string;
    sortTitleAsc: string;
  };
};

export function ReviewsToolbar({
  actionHref,
  categories,
  values,
  labels,
}: Props) {
  return (
    <form
      action={actionHref}
      method="get"
      className="rounded-2xl border border-border bg-surface p-4 md:p-5"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="block text-sm xl:col-span-2">
          <span className="mb-1 block text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {labels.search}
          </span>
          <input
            type="search"
            name="q"
            defaultValue={values.q}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {labels.category}
          </span>
          <select
            name="category"
            defaultValue={values.category}
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <option value="">{labels.allCategories}</option>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {labels.minScore}
          </span>
          <select
            name="minScore"
            defaultValue={values.minScore}
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <option value="">{labels.anyScore}</option>
            {[9, 8, 7, 6, 5].map((score) => (
              <option key={score} value={String(score)}>
                ≥ {score.toFixed(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {labels.sort}
          </span>
          <select
            name="sort"
            defaultValue={values.sort}
            className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm"
          >
            <option value="newest">{labels.sortNewest}</option>
            <option value="oldest">{labels.sortOldest}</option>
            <option value="score_desc">{labels.sortScoreDesc}</option>
            <option value="score_asc">{labels.sortScoreAsc}</option>
            <option value="price_asc">{labels.sortPriceAsc}</option>
            <option value="price_desc">{labels.sortPriceDesc}</option>
            <option value="rating_desc">{labels.sortRatingDesc}</option>
            <option value="title_asc">{labels.sortTitleAsc}</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-white"
        >
          {labels.apply}
        </button>
        <a
          href={actionHref}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary transition hover:border-secondary"
        >
          {labels.reset}
        </a>
      </div>
    </form>
  );
}
