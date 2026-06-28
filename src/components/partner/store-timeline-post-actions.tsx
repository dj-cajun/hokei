"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type StoreTimelinePostActionsProps = {
  postId: string;
  redirectHref: string;
  /** 업체 LP: 삭제만 · 타임라인 페이지: 수정만 */
  mode?: "delete" | "edit";
};

export function StoreTimelinePostActions({
  postId,
  redirectHref,
  mode = "delete",
}: StoreTimelinePostActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        const msg = parseApiError(data) ?? "삭제에 실패했습니다.";
        setError(msg);
        showToast(msg, "error");
        return;
      }
      showToast("글이 삭제되었습니다.");
      router.push(redirectHref);
      router.refresh();
    } catch {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-t border-border-light px-3 py-2"
      onClick={(event) => event.stopPropagation()}
    >
      {mode === "edit" ? (
        <Link
          href={`/posts/${postId}/edit?returnTo=${encodeURIComponent(redirectHref)}`}
          className="rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/40"
        >
          수정
        </Link>
      ) : null}
      {mode === "delete" ? (
        <>
          <button
            type="button"
            onClick={() => setShowDelete((value) => !value)}
            className="rounded-md border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
          >
            삭제
          </button>

          {showDelete ? (
            <div className="w-full space-y-2 rounded-lg bg-red-50 p-2.5">
              <p className="text-[11px] text-red-700">
                삭제한 글은 복구할 수 없습니다.
              </p>
              {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                {deleting ? "삭제 중…" : "삭제 확인"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
