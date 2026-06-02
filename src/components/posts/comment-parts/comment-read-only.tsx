import type { CommentItem } from "@/components/posts/comment-types";
import { formatCommentTime } from "@/components/posts/comment-parts/format-comment-time";

type CommentReadOnlyProps = {
  comment: CommentItem;
};

export function CommentReadOnly({ comment }: CommentReadOnlyProps) {
  return (
    <li className="rounded-sm bg-gray-50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">
          {comment.authorName}
        </span>
        <time className="text-[10px] text-gray-400">
          {formatCommentTime(comment.createdAt)}
        </time>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
        {comment.content}
      </p>
    </li>
  );
}
