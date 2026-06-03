"use client";

import { YouTubeEmbed } from "@/components/youtube/youtube-embed";

/** https://www.youtube.com/watch?v=d-fY16xMeT4&t=12s */
const DEFAULT_VIDEO_ID = "d-fY16xMeT4";
const DEFAULT_START_SECONDS = 12;

const videoId =
  process.env.NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_ID?.trim() || DEFAULT_VIDEO_ID;

const startSeconds = (() => {
  const raw = process.env.NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_START?.trim();
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return DEFAULT_START_SECONDS;
})();

const FALLBACK_TITLE =
  "호치민 한인 커뮤니티 하이라이트 — 영상 ID를 설정하면 재생됩니다";
const FALLBACK_META = "NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_ID 환경 변수";

/** 부모 레이아웃(mobile/desktop 블록)의 lg:hidden·lg:block만으로 표시 구분 */
export function HomeVideoHighlight() {
  if (!videoId) {
    return (
      <section className="w-full bg-white px-3 pb-3 pt-2" aria-label="하이라이트 영상">
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
    <section className="w-full bg-white px-3 pb-3 pt-2" aria-label="하이라이트 영상">
      <YouTubeEmbed
        videoId={videoId}
        startSeconds={startSeconds}
        title="호치민 하이라이트 영상"
        className="my-0 shadow-md"
        autoplay
        mute
        loop
      />
      <h2 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900">
        호치민 교민 커뮤니티 하이라이트
      </h2>
      <p className="mt-0.5 text-[11px] text-gray-400">
        YouTube · 음소거 자동 반복 재생
      </p>
    </section>
  );
}
