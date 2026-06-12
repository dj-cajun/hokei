"use client";

import { FormEvent, useState } from "react";
import type { CommentItem } from "@/components/posts/comment-types";
import { CommentEditForm } from "@/components/posts/comment-parts/comment-edit-form";
import { commentInputClass } from "@/components/posts/comment-parts/constants";
import { formatCommentTime } from "@/components/posts/comment-parts/format-comment-time";
import { useCommentActions } from "@/components/posts/comment-parts/use-comment-actions";

type CommentManageableRowProps = {
  postId: string;
  comment: CommentItem;
  onUpdate: (updated: CommentItem) => void;
  onDelete: () => void;
};

export function CommentManageableRow({
  postId,
  comment,
  onUpdate,
  onDelete,
}: CommentManageableRowProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [guestPassword, setGuestPassword] = useState("");
  const { error, setError, busy, patchComment, deleteComment } =
    useCommentActions({ postId, comment, onUpdate, onDelete });

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const ok = await patchComment(editContent, guestPassword);
    if (ok) setEditing(false);
  }

  return (
    <li className="rounded-sm bg-muted px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-700">
          {comment.authorName}
        </span>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditContent(comment.content);
                  setEditing(true);
                  setError("");
                }}
                className="text-[10px] text-muted-foreground hover:text-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => void deleteComment(guestPassword)}
                disabled={busy}
                className="text-[10px] text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                삭제
              </button>
            </>
          )}
          <time className="text-[10px] text-muted-foreground">
            {formatCommentTime(comment.createdAt)}
          </time>
        </div>
      </div>

      {editing ? (
        <CommentEditForm
          comment={comment}
          editContent={editContent}
          guestPassword={guestPassword}
          error={error}
          busy={busy}
          onEditContentChange={setEditContent}
          onGuestPasswordChange={setGuestPassword}
          onSubmit={(e) => void handleSave(e)}
          onCancel={() => {
            setEditing(false);
            setError("");
          }}
        />
      ) : (
        <>
          <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
            {comment.content}
          </p>
          {comment.isGuestComment && !comment.isOwner && (
            <input
              type="password"
              placeholder="수정·삭제 시 비밀번호"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              className={`mt-2 ${commentInputClass}`}
            />
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </>
      )}
    </li>
  );
}
