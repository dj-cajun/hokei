import type { CommentItem } from "@/components/posts/comment-types";
import { formatCommentTime } from "@/components/posts/comment-parts/format-comment-time";
import { PostContent } from "@/components/posts/post-content";
import { ReportContentButton } from "@/components/posts/report-content-button";
import { cn } from "@/lib/utils";

type CommentReadOnlyProps = {
  comment: CommentItem;
  onReply?: () => void;
};

export function CommentReadOnly({ comment, onReply }: CommentReadOnlyProps) {
  return (
    <div
      className={cn(
        "rounded-sm bg-muted px-3 py-2",
        comment.pending && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          {comment.authorName}
        </span>
        <div className="flex items-center gap-2">
          {onReply && (
            <button
              type="button"
              onClick={onReply}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              답글
            </button>
          )}
          <time className="text-[10px] text-muted-foreground">
            {formatCommentTime(comment.createdAt)}
          </time>
        </div>
      </div>
      <PostContent
        content={comment.content}
        className="mt-1 text-sm text-foreground"
      />
      {!comment.pending && (
        <ReportContentButton
          targetType="COMMENT"
          targetId={comment.id}
          className="mt-1"
        />
      )}
    </div>
  );
}
