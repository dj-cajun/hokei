"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import type { CommentItem } from "@/components/posts/comment-types";
import { LoginTrigger } from "@/components/auth/login-trigger";
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

function CommentLoginPrompt({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
      <p className="text-sm text-foreground">댓글을 작성하려면 로그인이 필요합니다.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        계정이 없으시면 회원가입 후 로그인해 주세요.
      </p>
      <div className="mt-3 flex justify-center gap-2">
        <LoginTrigger
          asChild={false}
          callbackUrl={callbackUrl}
          className="rounded-sm bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white dark:bg-primary"
        >
          로그인
        </LoginTrigger>
        <Link
          href="/signup"
          className="rounded-sm border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card-hover"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}

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
  const pathname = usePathname();
  const { showToast } = useToast();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && Boolean(session?.user);

  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const callbackUrl = pathname || `/posts/${postId}`;

  if (!isLoggedIn) {
    return (
      <div className={compact ? "mt-2" : "mt-4"}>
        {replyToName && (
          <p className="mb-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{replyToName}</span>님에게
            답글
          </p>
        )}
        <CommentLoginPrompt callbackUrl={callbackUrl} />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-2 rounded-sm px-3 py-1.5 text-xs text-muted-foreground hover:bg-card-hover"
          >
            취소
          </button>
        )}
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("댓글 내용을 입력해 주세요.");
      return;
    }

    const authorName = session?.user?.name ?? "회원";
    const tempId = `pending-${Date.now()}`;
    const optimistic: CommentItem = {
      id: tempId,
      parentId: parentId ?? null,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      authorName,
      isOwner: true,
      isGuestComment: false,
      pending: true,
    };

    onCreated(optimistic);
    const snapshot = content.trim();
    setContent("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: snapshot,
          parentId,
        }),
      });
      const data = (await res.json()) as CommentItem & { error?: string };
      if (!res.ok) {
        onRollback?.(tempId);
        setError(parseApiError(data) ?? "댓글 등록에 실패했습니다.");
        setContent(snapshot);
        return;
      }
      showToast(parentId ? "답글이 등록되었습니다." : "댓글이 등록되었습니다.");
      onRollback?.(tempId);
      onCreated({
        id: data.id,
        parentId: data.parentId ?? parentId ?? null,
        content: data.content,
        createdAt: data.createdAt,
        authorName: data.authorName ?? authorName,
        isOwner: true,
        isGuestComment: false,
      });
      onCancel?.();
      router.refresh();
    } catch {
      onRollback?.(tempId);
      setError("댓글 등록 중 오류가 발생했습니다.");
      setContent(snapshot);
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
      <textarea
        id="comment-content"
        name="content"
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
