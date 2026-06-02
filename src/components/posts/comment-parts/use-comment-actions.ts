"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommentItem } from "@/components/posts/comment-types";
import { resolveGuestPasswordForComment } from "@/components/posts/comment-parts/resolve-guest-password";
import { useToast } from "@/components/providers/toast-provider";

type UseCommentActionsArgs = {
  postId: string;
  comment: CommentItem;
  onUpdate: (updated: CommentItem) => void;
  onDelete: () => void;
};

export function useCommentActions({
  postId,
  comment,
  onUpdate,
  onDelete,
}: UseCommentActionsArgs) {
  const router = useRouter();
  const { showToast } = useToast();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const patchComment = useCallback(
    async (content: string, guestPasswordInput: string) => {
      setError("");
      const trimmed = content.trim();
      if (!trimmed) {
        setError("댓글 내용을 입력해 주세요.");
        return false;
      }

      const pw = resolveGuestPasswordForComment(comment, guestPasswordInput);
      if (!pw.ok) {
        setError(pw.message);
        return false;
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
              guestPassword: pw.password || undefined,
            }),
          }
        );
        const data = (await res.json()) as CommentItem & { error?: string };
        if (!res.ok) {
          setError(data.error ?? "댓글 수정에 실패했습니다.");
          return false;
        }
        onUpdate(data);
        showToast("댓글이 수정되었습니다.");
        router.refresh();
        return true;
      } catch {
        setError("댓글 수정 중 오류가 발생했습니다.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [postId, comment, onUpdate, showToast, router]
  );

  const deleteComment = useCallback(
    async (guestPasswordInput: string) => {
      if (!confirm("이 댓글을 삭제할까요?")) return false;
      setError("");

      const pw = resolveGuestPasswordForComment(
        comment,
        guestPasswordInput,
        "삭제하려면 비밀번호를 입력해 주세요."
      );
      if (!pw.ok) {
        setError(pw.message);
        return false;
      }

      setBusy(true);
      try {
        const res = await fetch(
          `/api/posts/${postId}/comments/${comment.id}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestPassword: pw.password || undefined,
            }),
          }
        );
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "댓글 삭제에 실패했습니다.");
          return false;
        }
        onDelete();
        showToast("댓글이 삭제되었습니다.");
        router.refresh();
        return true;
      } catch {
        setError("댓글 삭제 중 오류가 발생했습니다.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [postId, comment, onDelete, showToast, router]
  );

  return { error, setError, busy, patchComment, deleteComment };
}
