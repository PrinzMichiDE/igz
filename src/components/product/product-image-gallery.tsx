"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  images: string[];
  alt: string;
};

export function ProductImageGallery({ images, alt }: Props) {
  const unique = [...new Set(images.filter(Boolean))];
  const [active, setActive] = useState(0);

  if (unique.length <= 1) return null;

  const current = unique[active] ?? unique[0];

  return (
    <section className="mt-6">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-surface-muted">
        <Image
          src={current}
          alt={alt}
          fill
          className="object-contain p-6"
          sizes="(max-width: 1280px) 100vw, 70vw"
          unoptimized
        />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {unique.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            className={
              index === active
                ? "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-secondary"
                : "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border opacity-80 transition hover:opacity-100"
            }
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-contain p-1"
              sizes="64px"
              unoptimized
            />
          </button>
        ))}
      </div>
    </section>
  );
}
