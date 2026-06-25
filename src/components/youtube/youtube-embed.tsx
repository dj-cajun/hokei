"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import {
  buildYouTubeEmbedSrc,
  buildYouTubeThumbnailUrl,
} from "@/lib/youtube/video-id";
import { cn } from "@/lib/utils";

type YouTubeEmbedProps = {
  videoId: string;
  startSeconds?: number;
  title?: string;
  className?: string;
  autoplay?: boolean;
  mute?: boolean;
  loop?: boolean;
};

function useIsOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}

/**
 * 반응형 16:9 임베드 — 고정 width/height 없음, `.video-container` + aspect-ratio
 * 오프라인·클릭 전에는 iframe을 로드하지 않아 YouTube generate_204 오류를 막음.
 * @see src/app/globals.css
 */
export function YouTubeEmbed({
  videoId,
  startSeconds,
  title = "YouTube video player",
  className,
  autoplay = false,
  mute = false,
  loop = false,
}: YouTubeEmbedProps) {
  const online = useIsOnline();
  const [mounted, setMounted] = useState(false);
  const [activated, setActivated] = useState(false);
  const [offlineHint, setOfflineHint] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && autoplay && online) {
      setActivated(true);
    }
  }, [mounted, autoplay, online]);

  const src = buildYouTubeEmbedSrc(videoId, {
    autoplay: autoplay || activated,
    mute: mute || autoplay,
    loop,
    startSeconds,
  });

  function activate() {
    if (!online) {
      setOfflineHint(true);
      return;
    }
    setOfflineHint(false);
    setActivated(true);
  }

  const showIframe = mounted && activated;

  if (!showIframe) {
    return (
      <div
        className={cn(
          "video-container my-3 overflow-hidden border border-border shadow-sm",
          className
        )}
      >
        <button
          type="button"
          onClick={activate}
          className="group relative block h-full w-full cursor-pointer border-0 bg-black p-0"
          aria-label={`${title} 재생`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={buildYouTubeThumbnailUrl(videoId)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition group-hover:scale-105">
            <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden />
          </span>
          {offlineHint && (
            <span className="absolute inset-x-0 bottom-0 bg-black/75 px-3 py-2 text-center text-xs text-white">
              인터넷 연결을 확인한 뒤 다시 시도해 주세요.
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "video-container my-3 overflow-hidden border border-border shadow-sm",
        className
      )}
    >
      <iframe
        title={title}
        src={src}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
