"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICgiIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=";

type ImageLightboxProps = {
  urls: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function ImageLightbox({
  urls,
  index,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const hasPrev = index > 0;
  const hasNext = index < urls.length - 1;

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(index - 1);
  }, [hasPrev, index, onIndexChange]);

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(index + 1);
  }, [hasNext, index, onIndexChange]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  const src = urls[index];
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal
      aria-label="이미지 확대"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
        onClick={onClose}
        aria-label="닫기"
      >
        <X className="h-5 w-5" />
      </button>

      {hasPrev && (
        <button
          type="button"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:left-4"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="이전 이미지"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 sm:right-4"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="다음 이미지"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      <div
        className="relative max-h-[90vh] max-w-[min(960px,100%)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={src}
          alt=""
          width={960}
          height={640}
          unoptimized
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          className="max-h-[90vh] w-auto rounded-lg object-contain"
        />
        {urls.length > 1 && (
          <p className="mt-2 text-center text-xs text-white/80">
            {index + 1} / {urls.length}
          </p>
        )}
      </div>
    </div>
  );
}

export { BLUR_DATA_URL };
