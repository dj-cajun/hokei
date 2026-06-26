"use client";

import { YouTubeEmbed } from "@/components/youtube/youtube-embed";

type HomeVideoHighlightProps = {
  videoId: string;
  startSeconds?: number;
};

/** 부모 레이아웃(mobile/desktop 블록)의 lg:hidden·lg:block만으로 표시 구분 */
export function HomeVideoHighlight({
  videoId,
  startSeconds = 0,
}: HomeVideoHighlightProps) {
  if (!videoId) {
    return (
      <section className="w-full bg-surface px-3 pb-3 pt-2" aria-label="하이라이트 영상">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg border border-border bg-neutral-100">
          <p className="px-4 text-center text-xs text-muted-foreground">
            관리자에서 YouTube URL을 설정해 주세요.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-surface px-3 pb-3 pt-2" aria-label="하이라이트 영상">
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
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        YouTube · 온라인 시 음소거 자동 재생
      </p>
    </section>
  );
}
