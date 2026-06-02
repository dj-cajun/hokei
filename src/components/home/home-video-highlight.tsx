"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_VIDEO_ID = "";
const videoId =
  process.env.NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_ID?.trim() || DEFAULT_VIDEO_ID;

const FALLBACK_TITLE =
  "호치민 한인 커뮤니티 하이라이트 — 영상 ID를 설정하면 재생됩니다";
const FALLBACK_META = "NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_ID 환경 변수";

export function HomeVideoHighlight() {
  const [playing, setPlaying] = useState(false);

  if (!videoId) {
    return (
      <section className="bg-white px-3 pb-3 pt-2" aria-label="하이라이트 영상">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-neutral-100">
          <p className="px-4 text-center text-xs text-gray-500">{FALLBACK_META}</p>
        </div>
        <h2 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900">
          {FALLBACK_TITLE}
        </h2>
      </section>
    );
  }

  return (
    <section className="bg-white px-3 pb-3 pt-2" aria-label="하이라이트 영상">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black shadow-md">
        {playing ? (
          <>
            <iframe
              title="호치민 하이라이트 영상"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label="영상 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group relative block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="영상 재생"
          >
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" />
            <span
              className={cn(
                "absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2",
                "items-center justify-center rounded-full bg-black/50 text-white shadow-lg backdrop-blur-sm"
              )}
            >
              <Play className="h-7 w-7 fill-white pl-0.5" />
            </span>
          </button>
        )}
      </div>
      <h2 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900">
        호치민 교민 커뮤니티 하이라이트
      </h2>
      <p className="mt-0.5 text-[11px] text-gray-400">YouTube · 탭하여 재생</p>
    </section>
  );
}
