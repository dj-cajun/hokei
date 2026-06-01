"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NewsThumbnail } from "@/components/news/thumbnail";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/types/feed";

export function HomeHeadlineSlider({ items }: { items: FeedItem[] }) {
  const slides = items.filter((i) => i.thumbnail || i.sourceUrl).slice(0, 5);
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    if (slides.length === 0) return;
    setIndex((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = window.setInterval(next, 5000);
    return () => window.clearInterval(t);
  }, [slides.length, next]);

  if (slides.length === 0) {
    return (
      <div className="aspect-[16/10] w-full bg-gray-200">
        <div className="flex h-full items-center justify-center text-sm text-gray-500">
          뉴스 이미지 준비 중
        </div>
      </div>
    );
  }

  const current = slides[index]!;

  return (
    <section className="relative w-full overflow-hidden bg-black" aria-label="헤드라인">
      <Link href={`/posts/${current.id}`} className="relative block aspect-[16/10] w-full">
        <NewsThumbnail
          src={current.thumbnail}
          sourceUrl={current.sourceUrl}
          topic={current.topic}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <h2 className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-bold leading-snug text-white">
          {current.title}
        </h2>
      </Link>

      {slides.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`슬라이드 ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all",
                i === index ? "w-3 bg-white" : "w-1 bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
