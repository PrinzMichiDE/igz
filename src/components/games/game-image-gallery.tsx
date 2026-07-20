"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  alt: string;
  emptyLabel?: string;
};

export function GameImageGallery({ images, alt, emptyLabel }: Props) {
  const unique = useMemo(
    () => [...new Set(images.filter(Boolean))],
    [images],
  );
  const [active, setActive] = useState(0);

  if (unique.length === 0) {
    return emptyLabel ? (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    ) : null;
  }

  const current = unique[Math.min(active, unique.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-surface-muted">
        <Image
          src={current}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 1280px) 100vw, 900px"
          unoptimized
          priority
        />
      </div>
      {unique.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {unique.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(index)}
              className={
                index === active
                  ? "relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border-2 border-secondary"
                  : "relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-border opacity-80 hover:opacity-100"
              }
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
