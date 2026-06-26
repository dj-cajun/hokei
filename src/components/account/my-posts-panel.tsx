"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type ManageablePost = {
  id: string;
  title: string;
  status: string;
  moderationStatus: string;
  publishedAt: string;
  categoryLabel: string;
  categoryHref: string;
};

type MyPostsPanelProps = {
  posts: ManageablePost[];
};

function statusLabel(post: ManageablePost) {
  if (post.status === "DRAFT") return "임시저장";
  if (post.moderationStatus === "HIDDEN") return "숨김";
  if (post.moderationStatus === "REMOVED") return "삭제됨";
  return "게시됨";
}

function statusClass(post: ManageablePost) {
  if (post.status === "DRAFT") return "bg-amber-50 text-amber-700";
  if (post.moderationStatus === "HIDDEN") return "bg-orange-50 text-orange-700";
  if (post.moderationStatus === "REMOVED") return "bg-red-50 text-red-600";
  return "bg-emerald-50 text-emerald-700";
}

export function MyPostsPanel({ posts }: MyPostsPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (posts.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">작성한 글이 없습니다.</p>
        <Link
          href="/write"
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          글쓰기
        </Link>
      </div>
    );
  }

  async function handleDelete(postId: string) {
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "삭제에 실패했습니다.", "error");
        return;
      }
      showToast("글이 삭제되었습니다.");
      setConfirmId(null);
      router.refresh();
    } catch {
      showToast("삭제 중 오류가 발생했습니다.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="mt-6 divide-y divide-border-light">
      {posts.map((post) => (
        <li key={post.id} className="py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusClass(post)}`}
                >
                  {statusLabel(post)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {post.categoryLabel}
                </span>
              </div>
              <Link
                href={`/posts/${post.id}`}
                className="mt-1 block line-clamp-2 text-sm font-medium hover:text-primary"
              >
                {post.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-card-hover"
              >
                수정
              </Link>
              <button
                type="button"
                onClick={() =>
                  setConfirmId((id) => (id === post.id ? null : post.id))
                }
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
          {confirmId === post.id && (
            <div className="mt-3 rounded-lg bg-red-50 p-3">
              <p className="text-xs text-red-700">
                이 글을 삭제할까요? 복구할 수 없습니다.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={deletingId === post.id}
                  onClick={() => void handleDelete(post.id)}
                  className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {deletingId === post.id ? "삭제 중…" : "삭제 확인"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="rounded border border-red-200 px-3 py-1 text-xs text-red-700"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
