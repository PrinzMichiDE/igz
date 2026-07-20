type VideoItem = {
  id: string;
  name?: string;
  embedUrl?: string | null;
  watchUrl?: string | null;
};

type Props = {
  title: string;
  videos: VideoItem[];
  emptyLabel?: string;
};

export function GameVideoEmbeds({ title, videos, emptyLabel }: Props) {
  const items = videos.filter((video) => video.embedUrl || video.watchUrl);
  if (items.length === 0) {
    return emptyLabel ? (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    ) : null;
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-semibold text-primary">{title}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {items.map((video) => (
          <article
            key={video.id}
            className="overflow-hidden rounded-xl border border-border bg-surface"
          >
            {video.embedUrl ? (
              <div className="aspect-video bg-black">
                <iframe
                  src={video.embedUrl}
                  title={video.name || "Trailer"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm font-medium text-primary">
                {video.name || "Trailer"}
              </p>
              {video.watchUrl ? (
                <a
                  href={video.watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-secondary hover:underline"
                >
                  YouTube →
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
