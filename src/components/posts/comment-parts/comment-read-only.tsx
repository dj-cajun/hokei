import type { CommentItem } from "@/components/posts/comment-types";
import { formatCommentTime } from "@/components/posts/comment-parts/format-comment-time";
import { PostContent } from "@/components/posts/post-content";
import { ReportContentButton } from "@/components/posts/report-content-button";

type CommentReadOnlyProps = {
  comment: CommentItem;
};

export function CommentReadOnly({ comment }: CommentReadOnlyProps) {
  return (
    <li className="rounded-sm bg-muted px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">
          {comment.authorName}
        </span>
        <time className="text-[10px] text-muted-foreground">
          {formatCommentTime(comment.createdAt)}
        </time>
      </div>
      <PostContent
        content={comment.content}
        className="mt-1 text-sm text-gray-800"
      />
      <ReportContentButton
        targetType="COMMENT"
        targetId={comment.id}
        className="mt-1"
      />
    </li>
  );
}
