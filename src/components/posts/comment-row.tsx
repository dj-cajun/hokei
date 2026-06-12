"use client";

import { memo } from "react";
import type { CommentItem } from "@/components/posts/comment-types";
import { CommentManageableRow } from "@/components/posts/comment-parts/comment-manageable-row";
import { CommentReadOnly } from "@/components/posts/comment-parts/comment-read-only";

type CommentRowProps = {
  postId: string;
  comment: CommentItem;
  onReply?: () => void;
  isReply?: boolean;
  onUpdate: (updated: CommentItem) => void;
  onDelete: () => void;
};

function CommentRowInner({
  postId,
  comment,
  onReply,
  isReply = false,
  onUpdate,
  onDelete,
}: CommentRowProps) {
  const canManage = comment.isOwner || comment.isGuestComment;
  const showReply = !isReply && onReply && !comment.parentId;

  if (!canManage) {
    return (
      <CommentReadOnly
        comment={comment}
        onReply={showReply ? onReply : undefined}
      />
    );
  }

  return (
    <CommentManageableRow
      postId={postId}
      comment={comment}
      onReply={showReply ? onReply : undefined}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  );
}

export const CommentRow = memo(CommentRowInner);
