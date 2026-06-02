"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { CommentItem } from "@/components/posts/comment-types";
import {
  saveGuestCommentCredentials,
} from "@/lib/guest-comment-storage";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

import { commentInputClass as inputClass } from "@/components/posts/comment-parts/constants";

type CommentFormProps = {
  postId: string;
  onCreated: (comment: CommentItem) => void;
};

export function CommentForm({ postId, onCreated }: CommentFormProps) {
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
      onCreated({
        id: data.id,
        content: data.content,
        createdAt: data.createdAt,
        authorName: data.authorName,
        isOwner: isLoggedIn,
        isGuestComment: !isLoggedIn,
      });
      setContent("");
      router.refresh();
    } catch {
      setError("댓글 등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-2">
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
        placeholder="댓글을 입력하세요"
        rows={3}
        className={`w-full resize-none px-3 py-2 ${inputClass}`}
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
  );
}
