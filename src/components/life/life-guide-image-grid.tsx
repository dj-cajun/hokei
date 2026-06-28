"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageLightbox, BLUR_DATA_URL } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";

type LifeGuideImageGridProps = {
  urls: string[];
  className?: string;
};

export function LifeGuideImageGrid({ urls, className }: LifeGuideImageGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <div className={cn("mt-4", className)}>
        <button
          type="button"
          className="block w-full cursor-zoom-in overflow-hidden rounded-xl border border-border"
          onClick={() => setLightboxIndex(0)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[0]}
            alt=""
            className="w-full object-cover"
          />
        </button>
        {lightboxIndex !== null && (
          <ImageLightbox
            urls={urls}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onIndexChange={setLightboxIndex}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "mt-4 flex flex-wrap gap-2",
          className
        )}
      >
        {urls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            className="h-20 w-20 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted"
            onClick={() => setLightboxIndex(index)}
          >
            <Image
              src={url}
              alt=""
              width={80}
              height={80}
              unoptimized
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox
          urls={urls}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
}
