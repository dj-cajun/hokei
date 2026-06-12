"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchResultList } from "@/components/search/search-result-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { FeedItem } from "@/types/feed";

type SearchInfiniteListProps = {
  query: string;
  initialItems: FeedItem[];
  initialOffset: number | null;
};

export function SearchInfiniteList({
  query,
  initialItems,
  initialOffset,
}: SearchInfiniteListProps) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [offset, setOffset] = useState(initialOffset);
  const [hasMore, setHasMore] = useState(initialOffset !== null);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || offset === null) return;
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", query);
      params.set("offset", String(offset));
      const res = await fetch(`/api/search/feed?${params}`);
      const data = await res.json();
      if (!res.ok || !data.ok) return;

      const next: FeedItem[] = data.items ?? [];
      setItems((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...next.filter((p: FeedItem) => !ids.has(p.id))];
      });
      setOffset(data.nextOffset ?? null);
      setHasMore(data.nextOffset !== null && data.nextOffset !== undefined);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, offset, query, searchParams]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: loading,
    onLoadMore: loadMore,
  });

  return (
    <>
      <SearchResultList items={items} query={query} />
      {hasMore && (
        <div ref={sentinelRef} className="px-2 py-4">
          {loading ? (
            <div className="space-y-2 px-1">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <p className="text-center text-[11px] text-muted-foreground">
              스크롤하면 더 불러옵니다
            </p>
          )}
        </div>
      )}
    </>
  );
}
