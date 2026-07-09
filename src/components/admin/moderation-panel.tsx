"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { BannedWordsPanel } from "@/components/admin/banned-words-panel";
import { ReportsQueue } from "@/components/admin/reports-queue";
import { cn } from "@/lib/utils";

type Tab = "posts" | "comments" | "reports";

type AdminPost = {
  id: string;
  title: string;
  publishedAt: string;
  moderationStatus: string;
  isAutomated: boolean;
  isGuest?: boolean;
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

const PAGE_LIMIT = 50;
const MATCH_LIMIT = 500;

function postsQueryString(q: string, guestOnly: boolean, cursor?: string | null) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (guestOnly) params.set("guestOnly", "1");
  params.set("limit", String(PAGE_LIMIT));
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

export function ModerationPanel() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("posts");
  const [q, setQ] = useState("");
  const [guestOnly, setGuestOnly] = useState(false);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [matchTotal, setMatchTotal] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [acting, setActing] = useState(false);

  const loadPosts = useCallback(
    async (
      mode: "replace" | "append" = "replace",
      cursorForAppend?: string | null
    ) => {
      if (mode === "replace") {
        setLoading(true);
        setSelected(new Set());
      } else {
        setLoadingMore(true);
      }
      try {
        const cursor = mode === "append" ? cursorForAppend : null;
        const res = await fetch(
          `/api/admin/posts?${postsQueryString(q, guestOnly, cursor)}`
        );
        const data = (await res.json()) as {
          posts?: AdminPost[];
          nextCursor?: string | null;
        };
        if (!res.ok) return;
        const items = data.posts ?? [];
        setPosts((prev) => (mode === "append" ? [...prev, ...items] : items));
        setNextCursor(data.nextCursor ?? null);

        if (mode === "replace") {
          const idRes = await fetch(
            `/api/admin/posts/ids?${postsQueryString(q, guestOnly)}&limit=${MATCH_LIMIT}`
          );
          const idData = (await idRes.json()) as { total?: number };
          if (idRes.ok) setMatchTotal(idData.total ?? null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, guestOnly]
  );

  const loadComments = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await fetch(
        `/api/admin/comments?q=${encodeURIComponent(q)}&limit=${PAGE_LIMIT}`
      );
      const data = (await res.json()) as { comments?: AdminComment[] };
      if (res.ok) setComments(data.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [q]);

  const load = useCallback(async () => {
    if (tab === "posts") await loadPosts("replace");
    else if (tab === "comments") await loadComments();
  }, [tab, loadPosts, loadComments]);

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

  function selectAllVisible() {
    const ids =
      tab === "posts" ? posts.map((p) => p.id) : comments.map((c) => c.id);
    setSelected(new Set(ids));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function selectAllMatching() {
    if (tab !== "posts") return;
    setActing(true);
    try {
      const res = await fetch(
        `/api/admin/posts/ids?${postsQueryString(q, guestOnly)}&limit=${MATCH_LIMIT}`
      );
      const data = (await res.json()) as {
        ids?: string[];
        total?: number;
        capped?: boolean;
      };
      if (!res.ok) {
        showToast("검색 결과를 불러오지 못했습니다.", "error");
        return;
      }
      setSelected(new Set(data.ids ?? []));
      const total = data.total ?? 0;
      const picked = data.ids?.length ?? 0;
      if (data.capped) {
        showToast(`검색 ${total}건 중 ${picked}건 선택 (최대 ${MATCH_LIMIT})`);
      } else {
        showToast(`${picked}건 전체 선택`);
      }
    } finally {
      setActing(false);
    }
  }

  function postQueryPayload() {
    return {
      q: q.trim() || undefined,
      guestOnly: guestOnly || undefined,
      max: MATCH_LIMIT,
    };
  }

  async function bulkPost(
    action: "HIDE" | "RESTORE" | "REMOVE" | "DELETE",
    options?: { useQuery?: boolean }
  ) {
    const useQuery = options?.useQuery ?? selected.size > 100;
    if (!useQuery && selected.size === 0) return;

    if (action === "DELETE") {
      const countLabel = useQuery
        ? `검색 조건에 맞는 최대 ${MATCH_LIMIT}건`
        : `${selected.size}건`;
      if (
        !confirm(
          `${countLabel}을(를) 영구 삭제할까요?\nDB에서 완전히 지워지며 복구할 수 없습니다.`
        )
      ) {
        return;
      }
    }

    setActing(true);
    try {
      if (useQuery) {
        const res = await fetch("/api/admin/posts/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, query: postQueryPayload() }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(parseApiError(data) ?? "처리 실패", "error");
          return;
        }
        if (action === "DELETE") {
          showToast(`${data.deleted ?? 0}건 영구 삭제 (매칭 ${data.matched ?? 0}건)`);
        } else {
          showToast(`${data.updated ?? 0}건 처리 (매칭 ${data.matched ?? 0}건)`);
        }
        void loadPosts("replace");
        return;
      }

      const ids = [...selected];
      let deleted = 0;
      let updated = 0;
      for (let i = 0; i < ids.length; i += 100) {
        const chunk = ids.slice(i, i + 100);
        const res = await fetch("/api/admin/posts/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: chunk, action }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(parseApiError(data) ?? "처리 실패", "error");
          return;
        }
        deleted += data.deleted ?? 0;
        updated += data.updated ?? 0;
      }
      if (action === "DELETE") {
        showToast(`${deleted}건 영구 삭제되었습니다.`);
      } else {
        showToast(`${updated}건 처리되었습니다.`);
      }
      void loadPosts("replace");
    } finally {
      setActing(false);
    }
  }

  async function deleteOnePost(id: string, title: string) {
    if (
      !confirm(
        `「${title.slice(0, 40)}」을(를) 영구 삭제할까요?\n복구할 수 없습니다.`
      )
    ) {
      return;
    }
    setActing(true);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showToast(parseApiError(data) ?? "삭제 실패", "error");
        return;
      }
      showToast("영구 삭제되었습니다.");
      void loadPosts("replace");
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
      void loadComments();
    } finally {
      setActing(false);
    }
  }

  const visibleIds =
    tab === "posts" ? posts.map((p) => p.id) : comments.map((c) => c.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  return (
    <div className="space-y-4">
      <BannedWordsPanel />

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
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="min-w-[200px] flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              placeholder="제목·내용·작성자 검색"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
            />
            {tab === "posts" && (
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={guestOnly}
                  onChange={(e) => setGuestOnly(e.target.checked)}
                />
                비회원만
              </label>
            )}
            <Button onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
            </Button>
          </div>

          {tab === "posts" && matchTotal !== null && q.trim() && (
            <p className="text-xs text-muted-foreground">
              검색 결과 약 {matchTotal.toLocaleString()}건
              {guestOnly ? " (비회원)" : ""}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={loading || visibleIds.length === 0}
              onClick={() =>
                allVisibleSelected ? clearSelection() : selectAllVisible()
              }
            >
              {allVisibleSelected ? "현재 목록 선택 해제" : "현재 목록 전체 선택"}
            </Button>
            {tab === "posts" && q.trim() && (
              <Button
                size="sm"
                variant="outline"
                disabled={acting}
                onClick={() => void selectAllMatching()}
              >
                검색 결과 전체 선택
              </Button>
            )}
            {selected.size > 0 && (
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                선택 해제 ({selected.size})
              </Button>
            )}
          </div>

          {(selected.size > 0 || (tab === "posts" && q.trim())) && (
            <div className="flex flex-wrap gap-2 rounded-2xl bg-surface p-3">
              {selected.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selected.size}건 선택
                </span>
              )}
              {tab === "posts" ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting || selected.size === 0}
                    onClick={() => void bulkPost("HIDE")}
                  >
                    숨김
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting || selected.size === 0}
                    onClick={() => void bulkPost("RESTORE")}
                  >
                    복구
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting || selected.size === 0}
                    onClick={() => void bulkPost("REMOVE")}
                  >
                    목록에서 제거
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={acting || selected.size === 0}
                    onClick={() => void bulkPost("DELETE")}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    선택 영구 삭제
                  </Button>
                  {q.trim() && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={acting}
                      onClick={() => void bulkPost("DELETE", { useQuery: true })}
                    >
                      검색 결과 일괄 삭제
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting}
                    onClick={() => void bulkComment("HIDE")}
                  >
                    숨김
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={acting}
                    onClick={() => void bulkComment("RESTORE")}
                  >
                    표시
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={acting}
                    onClick={() => void bulkComment("DELETE")}
                  >
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
                      {p.isGuest && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                          비회원
                        </span>
                      )}
                      {p.isAutomated && (
                        <span className="text-xs text-muted-foreground">
                          자동뉴스
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {p.category.label}
                      </span>
                    </div>
                    <p className="mt-1 font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.authorName} ·{" "}
                      {new Date(p.publishedAt).toLocaleString("ko-KR")}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                    disabled={acting}
                    aria-label="영구 삭제"
                    onClick={(e) => {
                      e.preventDefault();
                      void deleteOnePost(p.id, p.title);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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

          {tab === "posts" && nextCursor && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={loadingMore}
                onClick={() => void loadPosts("append", nextCursor)}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "더 불러오기"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
