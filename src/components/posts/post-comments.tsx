"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getGuestCommentCredentials,
  saveGuestCommentCredentials,
} from "@/lib/guest-comment-storage";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

export type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  authorName: string;
  isOwner: boolean;
  isGuestComment: boolean;
};

type PostCommentsProps = {
  postId: string;
  initialComments: CommentItem[];
};

function CommentRow({
  postId,
  comment,
  onUpdate,
  onDelete,
}: {
  postId: string;
  comment: CommentItem;
  onUpdate: (updated: CommentItem) => void;
  onDelete: () => void;
}) {
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
                className="text-[10px] text-gray-500 hover:text-gray-800"
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
              className="w-full rounded-sm border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-0"
            />
          )}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-sm border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:ring-0"
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
              className="mt-2 w-full rounded-sm border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-0"
            />
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </>
      )}
    </li>
  );
}

export function PostComments({ postId, initialComments }: PostCommentsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

  const [comments, setComments] = useState(initialComments);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("댓글 내용을 입력해 주세요.");
      return;
    }
    if (!isLoggedIn && (!guestName.trim() || !guestPassword.trim())) {
      setError("비회원 댓글은 이름과 비밀번호가 필요합니다.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          guestName: isLoggedIn ? undefined : guestName.trim(),
          guestPassword: isLoggedIn ? undefined : guestPassword,
        }),
      });
      const data = (await res.json()) as CommentItem & { error?: string };
      if (!res.ok) {
        setError(parseApiError(data) ?? "댓글 등록에 실패했습니다.");
        return;
      }
      showToast("댓글이 등록되었습니다.");
      if (!isLoggedIn) {
        saveGuestCommentCredentials({
          name: guestName.trim(),
          password: guestPassword,
        });
      }
      const newComment: CommentItem = {
        id: data.id,
        content: data.content,
        createdAt: data.createdAt,
        authorName: data.authorName,
        isOwner: isLoggedIn,
        isGuestComment: !isLoggedIn,
      };
      setComments((prev) => [...prev, newComment]);
      setContent("");
      router.refresh();
    } catch {
      setError("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

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

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-2">
        {!isLoggedIn && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="이름"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="rounded-sm border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-0"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              className="rounded-sm border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-0"
            />
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="댓글을 입력하세요"
          rows={3}
          className="w-full resize-none rounded-sm border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-0"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-sm bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "등록 중…" : "댓글 등록"}
        </button>
      </form>
    </section>
  );
}
