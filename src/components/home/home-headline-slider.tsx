"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { NewsThumbnail } from "@/components/news/thumbnail";
import { cn } from "@/lib/utils";
import { shouldShowFeedThumbnail } from "@/lib/news/feed-thumbnail";
import type { FeedItem } from "@/types/feed";

const SWIPE_THRESHOLD_PX = 48;

export function HomeHeadlineSlider({ items }: { items: FeedItem[] }) {
  const slides = items.filter((i) => shouldShowFeedThumbnail(i)).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (slides.length === 0) return;
      setIndex((i) => (i + delta + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => go(1), [go]);
  const prev = useCallback(() => go(-1), [go]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const t = window.setInterval(next, 5000);
    return () => window.clearInterval(t);
  }, [slides.length, next, paused]);

  if (slides.length === 0) {
    return (
      <div className="aspect-[16/10] w-full bg-muted">
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          뉴스 이미지 준비 중
        </div>
      </div>
    );
  }

  const current = slides[index]!;

  return (
    <section
      className="relative w-full overflow-hidden bg-black"
      aria-label="헤드라인"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start == null) return;
        const endX = e.changedTouches[0]?.clientX;
        if (endX == null) return;
        const diff = endX - start;
        if (diff > SWIPE_THRESHOLD_PX) prev();
        else if (diff < -SWIPE_THRESHOLD_PX) next();
      }}
    >
      <Link
        href={`/posts/${current.id}`}
        className="relative block aspect-[16/10] w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <NewsThumbnail
          key={index}
          src={current.thumbnail}
          sourceUrl={current.sourceUrl}
          topic={current.topic}
          className="headline-crossfade h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <h2 className="absolute bottom-3 left-3 right-3 line-clamp-2 text-sm font-bold leading-snug text-white">
          {current.title}
        </h2>
      </Link>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-pressed={paused}
            aria-label={paused ? "슬라이드 자동 재생" : "슬라이드 자동 재생 일시정지"}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? (
              <Play className="h-4 w-4" aria-hidden />
            ) : (
              <Pause className="h-4 w-4" aria-hidden />
            )}
          </button>
        <div
          className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-1"
          role="tablist"
          aria-label="슬라이드 선택"
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`슬라이드 ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-1 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-black/50",
                i === index ? "w-3 bg-surface" : "w-1 bg-surface/50"
              )}
            />
          ))}
        </div>
        </>
      )}
    </section>
  );
}
