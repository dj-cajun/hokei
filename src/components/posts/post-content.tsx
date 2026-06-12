import { YouTubeEmbed } from "@/components/youtube/youtube-embed";
import { convertYoutubeLinks } from "@/lib/youtube/video-id";
import {
  looksLikeHtml,
  sanitizePostHtml,
} from "@/lib/sanitize-html";

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
    return (
      <div
        className={`post-content text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
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
