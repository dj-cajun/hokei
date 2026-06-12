"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { CommentItem } from "@/components/posts/comment-types";
import { saveGuestCommentCredentials } from "@/lib/guest-comment-storage";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { commentInputClass as inputClass } from "@/components/posts/comment-parts/constants";

type CommentFormProps = {
  postId: string;
  parentId?: string;
  replyToName?: string;
  onCreated: (comment: CommentItem) => void;
  onRollback?: (tempId: string) => void;
  onCancel?: () => void;
  compact?: boolean;
};

export function CommentForm({
  postId,
  parentId,
  replyToName,
  onCreated,
  onRollback,
  onCancel,
  compact = false,
}: CommentFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);

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

    const authorName =
      session?.user?.name ?? (isLoggedIn ? "회원" : guestName.trim() || "익명");
    const tempId = `pending-${Date.now()}`;
    const optimistic: CommentItem = {
      id: tempId,
      parentId: parentId ?? null,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      authorName,
      isOwner: isLoggedIn,
      isGuestComment: !isLoggedIn,
      pending: true,
    };

    onCreated(optimistic);
    const snapshot = {
      content: content.trim(),
      guestName: guestName.trim(),
      guestPassword,
    };
    setContent("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: snapshot.content,
          parentId,
          guestName: isLoggedIn ? undefined : snapshot.guestName,
          guestPassword: isLoggedIn ? undefined : snapshot.guestPassword,
        }),
      });
      const data = (await res.json()) as CommentItem & { error?: string };
      if (!res.ok) {
        onRollback?.(tempId);
        setError(parseApiError(data) ?? "댓글 등록에 실패했습니다.");
        setContent(snapshot.content);
        return;
      }
      showToast(parentId ? "답글이 등록되었습니다." : "댓글이 등록되었습니다.");
      if (!isLoggedIn) {
        saveGuestCommentCredentials({
          name: snapshot.guestName,
          password: snapshot.guestPassword,
        });
      }
      onRollback?.(tempId);
      onCreated({
        id: data.id,
        parentId: data.parentId ?? parentId ?? null,
        content: data.content,
        createdAt: data.createdAt,
        authorName: data.authorName ?? authorName,
        isOwner: isLoggedIn,
        isGuestComment: !isLoggedIn,
      });
      onCancel?.();
      router.refresh();
    } catch {
      onRollback?.(tempId);
      setError("댓글 등록 중 오류가 발생했습니다.");
      setContent(snapshot.content);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={compact ? "mt-2 space-y-2" : "mt-4 space-y-2"}
    >
      {replyToName && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{replyToName}</span>님에게
          답글
        </p>
      )}
      {!isLoggedIn && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="이름"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={guestPassword}
            onChange={(e) => setGuestPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "답글을 입력하세요" : "댓글을 입력하세요"}
        rows={compact ? 2 : 3}
        className={`w-full resize-none px-3 py-2 ${inputClass}`}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-sm bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-primary"
        >
          {submitting ? "등록 중…" : parentId ? "답글 등록" : "댓글 등록"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm px-3 py-1.5 text-xs text-muted-foreground hover:bg-card-hover"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
