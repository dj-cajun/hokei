"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommentItem } from "@/components/posts/comment-types";
import {
  getGuestCommentCredentials,
} from "@/lib/guest-comment-storage";
import { useToast } from "@/components/providers/toast-provider";

const inputClass =
  "w-full rounded-sm border border-gray-200 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1";

type CommentRowProps = {
  postId: string;
  comment: CommentItem;
  onUpdate: (updated: CommentItem) => void;
  onDelete: () => void;
};

export function CommentRow({
  postId,
  comment,
  onUpdate,
  onDelete,
}: CommentRowProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const canManage = comment.isOwner || comment.isGuestComment;
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [guestPassword, setGuestPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!canManage) {
    return (
      <li className="rounded-sm bg-gray-50 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-700">
            {comment.authorName}
          </span>
          <time className="text-[10px] text-gray-400">
            {new Date(comment.createdAt).toLocaleString("ko-KR", {
              timeZone: "Asia/Ho_Chi_Minh",
            })}
          </time>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
          {comment.content}
        </p>
      </li>
    );
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = editContent.trim();
    if (!trimmed) {
      setError("댓글 내용을 입력해 주세요.");
      return;
    }

    let password = guestPassword;
    if (comment.isGuestComment && !comment.isOwner) {
      const cached = getGuestCommentCredentials();
      if (!password && cached) password = cached.password;
      if (!password) {
        setError("비밀번호를 입력해 주세요.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: trimmed,
            guestPassword: password || undefined,
          }),
        }
      );
      const data = (await res.json()) as CommentItem & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "댓글 수정에 실패했습니다.");
        return;
      }
      onUpdate(data);
      setEditing(false);
      showToast("댓글이 수정되었습니다.");
      router.refresh();
    } catch {
      setError("댓글 수정 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("이 댓글을 삭제할까요?")) return;
    setError("");

    let password = guestPassword;
    if (comment.isGuestComment && !comment.isOwner) {
      const cached = getGuestCommentCredentials();
      if (!password && cached) password = cached.password;
      if (!password) {
        setError("삭제하려면 비밀번호를 입력해 주세요.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await fetch(
        `/api/posts/${postId}/comments/${comment.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestPassword: password || undefined,
          }),
        }
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "댓글 삭제에 실패했습니다.");
        return;
      }
      onDelete();
      showToast("댓글이 삭제되었습니다.");
      router.refresh();
    } catch {
      setError("댓글 삭제 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-sm bg-gray-50 px-3 py-2">
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
                className="text-[10px] text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={busy}
                className="text-[10px] text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                삭제
              </button>
            </>
          )}
          <time className="text-[10px] text-gray-400">
            {new Date(comment.createdAt).toLocaleString("ko-KR", {
              timeZone: "Asia/Ho_Chi_Minh",
            })}
          </time>
        </div>
      </div>

      {editing ? (
        <form onSubmit={(e) => void handleSave(e)} className="mt-2 space-y-2">
          {comment.isGuestComment && !comment.isOwner && (
            <input
              type="password"
              placeholder="댓글 비밀번호"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              className={inputClass}
            />
          )}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className={inputClass}
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
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError("");
              }}
              className="text-xs text-gray-500"
            >
              취소
            </button>
          </div>
        </form>
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
              className={`mt-2 ${inputClass}`}
            />
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </>
      )}
    </li>
  );
}
