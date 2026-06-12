import { buildYouTubeEmbedSrc } from "@/lib/youtube/video-id";
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

/**
 * 반응형 16:9 임베드 — 고정 width/height 없음, `.video-container` + aspect-ratio
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
  const src = buildYouTubeEmbedSrc(videoId, {
    autoplay,
    mute: mute || autoplay,
    loop,
    startSeconds,
  });

  return (
    <div
      className={cn(
        "video-container my-3 border border-border shadow-sm",
        className
      )}
    >
      <iframe
        title={title}
        src={src}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; compute-pressure"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
