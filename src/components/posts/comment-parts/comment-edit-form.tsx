"use client";

import { FormEvent } from "react";
import type { CommentItem } from "@/components/posts/comment-types";
import { commentInputClass } from "@/components/posts/comment-parts/constants";

type CommentEditFormProps = {
  comment: CommentItem;
  editContent: string;
  guestPassword: string;
  error: string;
  busy: boolean;
  onEditContentChange: (value: string) => void;
  onGuestPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
};

export function CommentEditForm({
  comment,
  editContent,
  guestPassword,
  error,
  busy,
  onEditContentChange,
  onGuestPasswordChange,
  onSubmit,
  onCancel,
}: CommentEditFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2">
      {comment.isGuestComment && !comment.isOwner && (
        <input
          type="password"
          placeholder="댓글 비밀번호"
          value={guestPassword}
          onChange={(e) => onGuestPasswordChange(e.target.value)}
          className={commentInputClass}
        />
      )}
      <textarea
        value={editContent}
        onChange={(e) => onEditContentChange(e.target.value)}
        rows={2}
        className={commentInputClass}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-sm bg-[#0f172a] px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground">
          취소
        </button>
      </div>
    </form>
  );
}
