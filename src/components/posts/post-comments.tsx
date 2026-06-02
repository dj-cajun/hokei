"use client";

import { useState } from "react";
import type { CommentItem } from "@/components/posts/comment-types";
import { CommentForm } from "@/components/posts/comment-form";
import { CommentRow } from "@/components/posts/comment-row";

export type { CommentItem } from "@/components/posts/comment-types";

type PostCommentsProps = {
  postId: string;
  initialComments: CommentItem[];
};

export function PostComments({ postId, initialComments }: PostCommentsProps) {
  const [comments, setComments] = useState(initialComments);

  return (
    <section className="mt-4 border-t border-gray-100 pt-4">
      <h2 className="text-sm font-bold text-gray-900">
        댓글 {comments.length}
      </h2>

      <ul className="mt-2 space-y-3">
        {comments.length === 0 ? (
          <li className="text-xs text-gray-400">첫 댓글을 남겨 보세요.</li>
        ) : (
          comments.map((c) => (
            <CommentRow
              key={c.id}
              postId={postId}
              comment={c}
              onUpdate={(updated) =>
                setComments((prev) =>
                  prev.map((item) => (item.id === updated.id ? updated : item))
                )
              }
              onDelete={() =>
                setComments((prev) => prev.filter((item) => item.id !== c.id))
              }
            />
          ))
        )}
      </ul>

      <CommentForm
        postId={postId}
        onCreated={(newComment) =>
          setComments((prev) => [...prev, newComment])
        }
      />
    </section>
  );
}
