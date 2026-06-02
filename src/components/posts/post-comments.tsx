"use client";

import { useState } from "react";
import type { CommentItem } from "@/components/posts/comment-types";
import { CommentForm } from "@/components/posts/comment-form";
import { CommentList } from "@/components/posts/comment-list";

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

      <CommentList
        postId={postId}
        comments={comments}
        onUpdate={(updated) =>
          setComments((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          )
        }
        onDelete={(commentId) =>
          setComments((prev) => prev.filter((item) => item.id !== commentId))
        }
      />

      <CommentForm
        postId={postId}
        onCreated={(newComment) =>
          setComments((prev) => [...prev, newComment])
        }
      />
    </section>
  );
}
