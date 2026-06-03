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

/** 반응형 16:9 — 유튜브 [공유]→[퍼가기] embed URL 사용 */
export function YouTubeEmbed({
  videoId,
  startSeconds,
  title = "YouTube 영상",
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
        "relative my-3 aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black",
        className
      )}
    >
      <iframe
        title={title}
        src={src}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}
