"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

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

function buildEmbedSrc(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    ...(startSeconds > 0 ? { start: String(startSeconds) } : {}),
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

const FALLBACK_TITLE =
  "호치민 한인 커뮤니티 하이라이트 — 영상 ID를 설정하면 재생됩니다";
const FALLBACK_META = "NEXT_PUBLIC_YOUTUBE_HIGHLIGHT_ID 환경 변수";

function useIsDesktop(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

type HomeVideoHighlightProps = {
  /** mobile / desktop 레이아웃 슬롯 — 한 번에 하나만 마운트 */
  placement: "mobile" | "desktop";
};

export function HomeVideoHighlight({ placement }: HomeVideoHighlightProps) {
  const isDesktop = useIsDesktop();
  const active =
    isDesktop === null
      ? null
      : placement === "desktop"
        ? isDesktop
        : !isDesktop;

  const containerRef = useRef<HTMLElement>(null);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!active || !videoId) return;
    const root = containerRef.current;
    if (!root) return;

    const mountIframe = () => {
      setEmbedSrc((prev) => prev ?? buildEmbedSrc(videoId));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          mountIframe();
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "64px 0px" }
    );
    observer.observe(root);

    const fallback = window.setTimeout(mountIframe, 600);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [active, videoId]);

  if (active === false) return null;

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
    <section
      ref={containerRef}
      className="w-full bg-white px-3 pb-3 pt-2"
      aria-label="하이라이트 영상"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black shadow-md">
        {!embedSrc && (
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
            aria-hidden
          />
        )}
        {embedSrc && (
          <iframe
            title="호치민 하이라이트 영상"
            src={embedSrc}
            className="absolute inset-0 z-10 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}
      </div>
      <h2 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-gray-900">
        호치민 교민 커뮤니티 하이라이트
      </h2>
      <p className="mt-0.5 text-[11px] text-gray-400">
        YouTube · 음소거 자동 반복 재생
      </p>
    </section>
  );
}
