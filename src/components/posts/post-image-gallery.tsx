"use client";

import { useState } from "react";
import Image from "next/image";
import { BLUR_DATA_URL, ImageLightbox } from "@/components/ui/image-lightbox";

type PostImageGalleryProps = {
  images: { id: string; url: string; fileName: string }[];
};

export function PostImageGallery({ images }: PostImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const urls = images.map((img) => img.url);

  return (
    <>
      <div className="mt-3 space-y-2">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className="block w-full cursor-zoom-in overflow-hidden rounded-sm"
            onClick={() => setLightboxIndex(i)}
          >
            <Image
              src={img.url}
              alt={img.fileName}
              width={960}
              height={640}
              unoptimized
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="h-auto w-full object-cover transition-opacity hover:opacity-95"
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
