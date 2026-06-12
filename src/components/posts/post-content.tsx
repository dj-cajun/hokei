import { YouTubeEmbed } from "@/components/youtube/youtube-embed";
import { convertYoutubeLinks } from "@/lib/youtube/video-id";
import {
  looksLikeHtml,
  sanitizePostHtml,
} from "@/lib/sanitize-html";
import { PostContentHtml } from "@/components/posts/post-content-html";

type PostContentProps = {
  content: string;
  className?: string;
};

/**
 * 게시글 본문 — HTML(리치 에디터) 또는 plain text + YouTube 링크 임베드
 */
export function PostContent({ content, className }: PostContentProps) {
  if (looksLikeHtml(content)) {
    const safe = sanitizePostHtml(content);
    return <PostContentHtml html={safe} className={className} />;
  }

  const parts = convertYoutubeLinks(content);

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
