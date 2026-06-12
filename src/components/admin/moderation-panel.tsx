"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { ReportsQueue } from "@/components/admin/reports-queue";
import { cn } from "@/lib/utils";

type Tab = "posts" | "comments" | "reports";

type AdminPost = {
  id: string;
  title: string;
  publishedAt: string;
  moderationStatus: string;
  isAutomated: boolean;
  authorName: string;
  category: { label: string };
};

type AdminComment = {
  id: string;
  content: string;
  createdAt: string;
  isHidden: boolean;
  postId: string;
  authorName: string;
  post: { title: string };
};

export function ModerationPanel() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("posts");
  const [q, setQ] = useState("");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      if (tab === "posts") {
        const res = await fetch(
          `/api/admin/posts?q=${encodeURIComponent(q)}&limit=30`
        );
        const data = (await res.json()) as { posts?: AdminPost[] };
        if (res.ok) setPosts(data.posts ?? []);
      } else {
        const res = await fetch(
          `/api/admin/comments?q=${encodeURIComponent(q)}&limit=30`
        );
        const data = (await res.json()) as { comments?: AdminComment[] };
        if (res.ok) setComments(data.comments ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [tab, q]);

  useEffect(() => {
    if (tab === "reports") return;
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [tab, load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkPost(action: "HIDE" | "RESTORE" | "REMOVE") {
    if (selected.size === 0) return;
    setActing(true);
    try {
      const res = await fetch("/api/admin/posts/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "처리 실패", "error");
        return;
      }
      showToast(`${data.updated ?? 0}건 처리되었습니다.`);
      void load();
    } finally {
      setActing(false);
    }
  }

  async function bulkComment(action: "HIDE" | "RESTORE" | "DELETE") {
    if (selected.size === 0) return;
    if (action === "DELETE" && !confirm("선택 댓글을 영구 삭제할까요?")) return;
    setActing(true);
    try {
      const res = await fetch("/api/admin/comments/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "처리 실패", "error");
        return;
      }
      showToast("처리되었습니다.");
      void load();
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["posts", "comments", "reports"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
              setSelected(new Set());
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium",
              tab === t ? "bg-accent text-primary" : "bg-surface text-muted-foreground"
            )}
          >
            {t === "posts" ? "게시글" : t === "comments" ? "댓글" : "신고"}
          </button>
        ))}
      </div>

      {tab === "reports" ? (
        <ReportsQueue />
      ) : (
        <>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
          placeholder="제목·내용·작성자 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void load()}
        />
        <Button onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 rounded-2xl bg-surface p-3">
          <span className="text-sm text-muted-foreground">
            {selected.size}건 선택
          </span>
          {tab === "posts" ? (
            <>
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void bulkPost("HIDE")}>
                숨김
              </Button>
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void bulkPost("RESTORE")}>
                복구
              </Button>
              <Button size="sm" variant="destructive" disabled={acting} onClick={() => void bulkPost("REMOVE")}>
                <Trash2 className="mr-1 h-4 w-4" />
                제거
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void bulkComment("HIDE")}>
                숨김
              </Button>
              <Button size="sm" variant="outline" disabled={acting} onClick={() => void bulkComment("RESTORE")}>
                표시
              </Button>
              <Button size="sm" variant="destructive" disabled={acting} onClick={() => void bulkComment("DELETE")}>
                삭제
              </Button>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {tab === "posts" &&
          posts.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer gap-3 rounded-2xl bg-surface p-4"
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs",
                      p.moderationStatus === "VISIBLE"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-800"
                    )}
                  >
                    {p.moderationStatus}
                  </span>
                  {p.isAutomated && (
                    <span className="text-xs text-muted-foreground">자동뉴스</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {p.category.label}
                  </span>
                </div>
                <p className="mt-1 font-medium">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {p.authorName} · {new Date(p.publishedAt).toLocaleString("ko-KR")}
                </p>
              </div>
              <Link
                href={`/posts/${p.id}`}
                target="_blank"
                className="shrink-0 text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </label>
          ))}

        {tab === "comments" &&
          comments.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer gap-3 rounded-2xl bg-surface p-4"
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
                className="mt-1"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{c.content}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.authorName} · {c.post.title}
                  {c.isHidden ? " · 숨김" : ""}
                </p>
              </div>
              <Link
                href={`/posts/${c.postId}`}
                target="_blank"
                className="shrink-0 text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </label>
          ))}

        {!loading &&
          ((tab === "posts" && posts.length === 0) ||
            (tab === "comments" && comments.length === 0)) && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              검색 후 목록이 표시됩니다.
            </p>
          )}
      </div>
        </>
      )}
    </div>
  );
}
