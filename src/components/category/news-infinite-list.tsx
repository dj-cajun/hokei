"use client";

import { useCallback, useMemo, useState } from "react";
import { NewsListItem } from "@/components/home/news-list-item";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { groupNewsByIngestDate } from "@/lib/news/group-news-by-date";
import type { FeedItem } from "@/types/feed";

function formatDayHeading(dateLabel: string): string {
  const [y, m, d] = dateLabel.split("-").map(Number);
  if (!y || !m || !d) return dateLabel;
  return `${y}년 ${m}월 ${d}일`;
}

type NewsInfiniteListProps = {
  initialItems: FeedItem[];
  initialCursor: string | null;
};

export function NewsInfiniteList({
  initialItems,
  initialCursor,
}: NewsInfiniteListProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(Boolean(initialCursor));
  const [loading, setLoading] = useState(false);

  const dateGroups = useMemo(() => groupNewsByIngestDate(items), [items]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !cursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor });
      const res = await fetch(`/api/news/feed?${params}`);
      const data = await res.json();
      if (!res.ok || !data.ok) return;

      const next: FeedItem[] = data.items ?? [];
      setItems((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...next.filter((p: FeedItem) => !ids.has(p.id))];
      });
      setCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.nextCursor));
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, cursor]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: loading,
    onLoadMore: loadMore,
  });

  if (items.length === 0) {
    return (
      <EmptyState
        title="아직 수집된 뉴스가 없습니다"
        description="매일 오전 7시(호치민)에 자동으로 수집됩니다."
      />
    );
  }

  return (
    <>
      {dateGroups.map((group) => (
        <div key={group.dateLabel}>
          <h3 className="sticky top-11 z-10 border-b border-[#f3f4f6] bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground lg:top-14">
            {formatDayHeading(group.dateLabel)}
          </h3>
          <div>
            {group.items.map((item) => (
              <NewsListItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="px-2 py-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
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
