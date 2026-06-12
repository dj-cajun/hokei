"use client";

import { useMemo, useState } from "react";
import type { CommentItem } from "@/components/posts/comment-types";
import { CommentForm } from "@/components/posts/comment-form";
import { CommentList } from "@/components/posts/comment-list";
import { groupCommentsToThreads } from "@/lib/comment-tree";

export type { CommentItem } from "@/components/posts/comment-types";

type PostCommentsProps = {
  postId: string;
  initialComments: CommentItem[];
};

export function PostComments({ postId, initialComments }: PostCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [replyTo, setReplyTo] = useState<{
    parentId: string;
    authorName: string;
  } | null>(null);

  const threads = useMemo(() => groupCommentsToThreads(comments), [comments]);

  function addComment(comment: CommentItem) {
    setComments((prev) => [...prev, comment]);
  }

  function rollbackComment(tempId: string) {
    setComments((prev) => prev.filter((c) => c.id !== tempId));
  }

  function removeComment(commentId: string) {
    setComments((prev) =>
      prev.filter((c) => c.id !== commentId && c.parentId !== commentId)
    );
  }

  return (
    <section className="mt-4 border-t border-border-light pt-4">
      <h2 className="text-sm font-bold text-foreground">
        댓글 {comments.length}
      </h2>

      <CommentList
        postId={postId}
        threads={threads}
        replyToParentId={replyTo?.parentId ?? null}
        onReply={(parentId, authorName) =>
          setReplyTo({ parentId, authorName })
        }
        onCancelReply={() => setReplyTo(null)}
        onUpdate={(updated) =>
          setComments((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          )
        }
        onDelete={removeComment}
        onCommentCreated={addComment}
        onCommentRollback={rollbackComment}
      />

      {!replyTo && (
        <CommentForm
          postId={postId}
          onCreated={addComment}
          onRollback={rollbackComment}
        />
      )}
    </section>
  );
}
