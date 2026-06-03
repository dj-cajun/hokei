"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { loadYouTubeIframeApi } from "@/lib/youtube/load-iframe-api";

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

export function HomeVideoHighlight() {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const reactId = useId();
  const playerElementId = `yt-highlight-${reactId.replace(/:/g, "")}`;

  const [visible, setVisible] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !videoId) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "120px 0px" }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !videoId || playerRef.current) return;
    const host = playerHostRef.current;
    if (!host) return;

    let cancelled = false;

    (async () => {
      try {
        await loadYouTubeIframeApi();
        if (cancelled || !playerHostRef.current) return;

        const origin =
          typeof window !== "undefined" ? window.location.origin : "";

        playerRef.current = new YT.Player(playerHostRef.current, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: videoId,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            ...(origin ? { origin } : {}),
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              event.target.mute();
              if (startSeconds > 0) {
                event.target.seekTo(startSeconds, true);
              }
              event.target.playVideo();
              setPlayerReady(true);
            },
            onStateChange: (event) => {
              if (event.data === YT.PlayerState.ENDED) {
                event.target.seekTo(startSeconds, true);
                event.target.playVideo();
              }
            },
          },
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [visible]);

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
    <section
      ref={containerRef}
      className="bg-white px-3 pb-3 pt-2"
      aria-label="하이라이트 영상"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black shadow-md">
        {!playerReady && !failed && (
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
            aria-hidden
          />
        )}
        {failed && (
          <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs text-gray-400">
            영상을 불러오지 못했습니다. 새로고침해 주세요.
          </p>
        )}
        <div
          id={playerElementId}
          ref={playerHostRef}
          className="absolute inset-0 h-full w-full"
        />
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
