"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type PostOwnerActionsProps = {
  postId: string;
  canEditAsUser: boolean;
  isGuestPost: boolean;
};

export function PostOwnerActions({
  postId,
  canEditAsUser,
  isGuestPost,
}: PostOwnerActionsProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [showDelete, setShowDelete] = useState(false);
  const [guestPassword, setGuestPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!canEditAsUser && !isGuestPost && !isAdmin) return null;

  async function handleDelete() {
    setError("");
    if (isGuestPost && !canEditAsUser && !guestPassword.trim()) {
      setError("삭제하려면 글 비밀번호를 입력해 주세요.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestPassword: guestPassword || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        const msg = parseApiError(data) ?? "삭제에 실패했습니다.";
        setError(msg);
        showToast(msg, "error");
        return;
      }
      showToast("글이 삭제되었습니다.");
      router.push("/community");
      router.refresh();
    } catch {
      setError("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
      <Link
        href={`/posts/${postId}/edit`}
        className="rounded-sm border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={() => setShowDelete((v) => !v)}
        className="rounded-sm border border-red-200 px-3 py-1 text-xs font-medium text-red-600"
      >
        삭제
      </button>

      {showDelete && (
        <div className="w-full space-y-2 rounded-sm bg-red-50 p-3">
          {isGuestPost && !canEditAsUser && (
            <input
              type="password"
              placeholder="글 비밀번호"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              className="w-full rounded-sm border border-red-100 px-2 py-1.5 text-sm focus:outline-none"
            />
          )}
          <p className="text-xs text-red-700">삭제한 글은 복구할 수 없습니다.</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="rounded-sm bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            {deleting ? "삭제 중…" : "삭제 확인"}
          </button>
        </div>
      )}
    </div>
  );
}
