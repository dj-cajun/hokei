import { PostContent } from "@/components/posts/post-content";
import { AuthorNameWithPremiumCrown } from "@/components/user/author-name-with-premium-crown";
import { cn } from "@/lib/utils";

type PostTimelineBodyProps = {
  publishedAt: Date;
  content: string;
  authorName?: string | null;
  showAuthorPremiumCrown?: boolean;
  className?: string;
};

function formatTimelineDate(date: Date): string {
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 게시글 본문 — 올린 날짜 타임라인 + 박스형 텍스트 */
export function PostTimelineBody({
  publishedAt,
  content,
  authorName,
  showAuthorPremiumCrown = false,
  className,
}: PostTimelineBodyProps) {
  if (!content.trim()) return null;

  return (
    <div className={cn("relative mt-4 pl-4", className)}>
      <div
        className="absolute bottom-1 left-[5px] top-1 w-0.5 rounded-full bg-primary/25"
        aria-hidden
      />
      <div className="relative">
        <span
          className="absolute -left-4 top-2 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-surface"
          aria-hidden
        />
        <time
          dateTime={publishedAt.toISOString()}
          className="mb-2 block pl-1 text-[11px] font-semibold text-primary"
        >
          {formatTimelineDate(publishedAt)}
        </time>
        <div className="rounded-xl border border-border-light bg-muted/30 px-3 py-3 shadow-sm">
          {authorName && (
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">
              <AuthorNameWithPremiumCrown
                name={authorName}
                showPremiumCrown={showAuthorPremiumCrown}
              />
            </p>
          )}
          <PostContent
            content={content}
            className="text-sm leading-relaxed text-foreground"
          />
        </div>
      </div>
    </div>
  );
}
