import { YouTubeEmbed } from "@/components/youtube/youtube-embed";
import {
  splitContentWithYouTubeEmbeds,
  stripRawIframeHtml,
} from "@/lib/youtube/video-id";

type PostContentProps = {
  content: string;
  className?: string;
};

/**
 * 게시글 본문 — 일반 youtube.com/watch 링크를 임베드 iframe으로 표시.
 * 주소창 URL을 iframe src에 넣으면 재생되지 않으므로 embed URL로 변환합니다.
 */
export function PostContent({ content, className }: PostContentProps) {
  const normalized = stripRawIframeHtml(content);
  const parts = splitContentWithYouTubeEmbeds(normalized);

  return (
    <div className={className}>
      {parts.map((part, index) =>
        part.type === "text" ? (
          <span key={index} className="whitespace-pre-wrap">
            {part.value}
          </span>
        ) : (
          <YouTubeEmbed
            key={`${part.videoId}-${index}`}
            videoId={part.videoId}
            startSeconds={part.startSeconds}
          />
        )
      )}
    </div>
  );
}
