import type { CommentItem } from "@/components/posts/comment-types";
import { CommentAuthorName } from "@/components/posts/comment-parts/comment-author-name";
import { CommentReactionBar } from "@/components/posts/comment-parts/comment-reaction-bar";
import { formatCommentTime } from "@/components/posts/comment-parts/format-comment-time";
import { PostContent } from "@/components/posts/post-content";
import { ReportContentButton } from "@/components/posts/report-content-button";
import { cn } from "@/lib/utils";

type CommentReadOnlyProps = {
  postId: string;
  comment: CommentItem;
  onReply?: () => void;
};

export function CommentReadOnly({ postId, comment, onReply }: CommentReadOnlyProps) {
  return (
    <div
      className={cn(
        "rounded-sm bg-muted px-3 py-2",
        comment.pending && "opacity-60"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <CommentAuthorName
          authorId={comment.authorId}
          authorName={comment.authorName}
          postId={postId}
        />
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
      <CommentReactionBar
        commentId={comment.id}
        initialLikeCount={comment.likeCount ?? 0}
        initialDislikeCount={comment.dislikeCount ?? 0}
        disabled={comment.pending}
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
