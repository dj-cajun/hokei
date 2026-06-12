import type { CommentItem } from "@/components/posts/comment-types";
import { CommentRow } from "@/components/posts/comment-row";

type CommentListProps = {
  postId: string;
  comments: CommentItem[];
  onUpdate: (updated: CommentItem) => void;
  onDelete: (commentId: string) => void;
};

export function CommentList({
  postId,
  comments,
  onUpdate,
  onDelete,
}: CommentListProps) {
  return (
    <ul className="mt-2 space-y-3">
      {comments.length === 0 ? (
        <li className="text-xs text-muted-foreground">첫 댓글을 남겨 보세요.</li>
      ) : (
        comments.map((c) => (
          <CommentRow
            key={c.id}
            postId={postId}
            comment={c}
            onUpdate={onUpdate}
            onDelete={() => onDelete(c.id)}
          />
        ))
      )}
    </ul>
  );
}
