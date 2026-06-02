"use client";

import { memo } from "react";
import type { CommentItem } from "@/components/posts/comment-types";
import { CommentManageableRow } from "@/components/posts/comment-parts/comment-manageable-row";
import { CommentReadOnly } from "@/components/posts/comment-parts/comment-read-only";

type CommentRowProps = {
  postId: string;
  comment: CommentItem;
  onUpdate: (updated: CommentItem) => void;
  onDelete: () => void;
};

function CommentRowInner({
  postId,
  comment,
  onUpdate,
  onDelete,
}: CommentRowProps) {
  const canManage = comment.isOwner || comment.isGuestComment;

  if (!canManage) {
    return <CommentReadOnly comment={comment} />;
  }

  return (
    <CommentManageableRow
      postId={postId}
      comment={comment}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
}

export const CommentRow = memo(CommentRowInner);
