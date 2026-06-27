"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";

type Props = {
  commentPostId: string;
  storeName: string;
  initialQuery?: string;
  onCommentPostIdChange: (id: string) => void;
};

export function PartnerPromoPostField({
  commentPostId,
  storeName,
  initialQuery = "",
  onCommentPostIdChange,
}: Props) {
  const { showToast } = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<{ id: string; title: string }[]>([]);
  const [searching, setSearching] = useState(false);

  async function searchPromoPosts() {
    const storeNameQuery = query.trim() || storeName.trim();
    if (!storeNameQuery) {
      showToast("업소명 또는 검색어를 입력해 주세요.", "error");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/admin/posts?storeName=${encodeURIComponent(storeNameQuery)}&limit=8`
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "홍보 글 검색 실패", "error");
        return;
      }
      setHits(
        (data.posts as { id: string; title: string }[] | undefined)?.map(
          (post) => ({ id: post.id, title: post.title })
        ) ?? []
      );
      if (!data.posts?.length) {
        showToast("일치하는 홍보 글이 없습니다.", "error");
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <Label htmlFor="commentPostId">댓글 연결 Post ID</Label>
      <Input
        id="commentPostId"
        value={commentPostId}
        onChange={(e) => onCommentPostIdChange(e.target.value)}
        placeholder="LP 하단 댓글용 홍보 글 ID"
        className="mt-1"
      />
      <div className="mt-2 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`홍보 글 검색 (기본: ${storeName || "업소명"})`}
          className="text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={searching}
          onClick={() => void searchPromoPosts()}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
        </Button>
      </div>
      {hits.length > 0 ? (
        <ul className="mt-2 max-h-36 overflow-y-auto rounded-md border border-border-light text-xs">
          {hits.map((post) => (
            <li key={post.id} className="border-b border-border-light last:border-0">
              <button
                type="button"
                className="w-full px-2 py-2 text-left hover:bg-secondary/60"
                onClick={() => {
                  onCommentPostIdChange(post.id);
                  showToast("댓글 글을 연결했습니다.");
                }}
              >
                <span className="font-medium">{post.title}</span>
                <span className="ml-1 text-muted-foreground">
                  {post.id.slice(0, 10)}…
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
