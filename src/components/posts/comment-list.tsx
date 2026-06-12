"use client";

import type { CommentItem } from "@/components/posts/comment-types";
import type { CommentThread } from "@/lib/comment-tree";
import { CommentRow } from "@/components/posts/comment-row";
import { CommentForm } from "@/components/posts/comment-form";

type CommentListProps = {
  postId: string;
  threads: CommentThread[];
  replyToParentId: string | null;
  onReply: (parentId: string, authorName: string) => void;
  onCancelReply: () => void;
  onUpdate: (updated: CommentItem) => void;
  onDelete: (commentId: string) => void;
  onCommentCreated: (comment: CommentItem) => void;
  onCommentRollback: (tempId: string) => void;
};

export function CommentList({
  postId,
  threads,
  replyToParentId,
  onReply,
  onCancelReply,
  onUpdate,
  onDelete,
  onCommentCreated,
  onCommentRollback,
}: CommentListProps) {
  return (
    <ul className="mt-2 space-y-3">
      {threads.length === 0 ? (
        <li className="text-xs text-muted-foreground">첫 댓글을 남겨 보세요.</li>
      ) : (
        threads.map((thread) => (
          <li key={thread.id} className="space-y-2">
            <CommentRow
              postId={postId}
              comment={thread}
              onReply={() => onReply(thread.id, thread.authorName)}
              onUpdate={onUpdate}
              onDelete={() => onDelete(thread.id)}
            />
            {replyToParentId === thread.id && (
              <div className="ml-4 border-l-2 border-border pl-3">
                <CommentForm
                  postId={postId}
                  parentId={thread.id}
                  replyToName={thread.authorName}
                  compact
                  onCreated={onCommentCreated}
                  onRollback={onCommentRollback}
                  onCancel={onCancelReply}
                />
              </div>
            )}
            {thread.replies.length > 0 && (
              <ul className="ml-4 space-y-2 border-l-2 border-border-light pl-3">
                {thread.replies.map((reply) => (
                  <li key={reply.id}>
                    <CommentRow
                      postId={postId}
                      comment={reply}
                      onUpdate={onUpdate}
                      onDelete={() => onDelete(reply.id)}
                      isReply
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))
      )}
    </ul>
  );
}
