"use client";

import { useCallback, useState } from "react";
import { TextListItem } from "@/components/home/news-list-item";
import { FadeInUp } from "@/components/ui/fade-in-up";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getWriteHref } from "@/lib/write-sections";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import type { FeedItem } from "@/types/feed";

type SectionInfiniteListProps = {
  sectionSlug: string;
  initialItems: FeedItem[];
  initialCursor: string | null;
  communityOnly?: boolean;
  region?: string;
};

export function SectionInfiniteList({
  sectionSlug,
  initialItems,
  initialCursor,
  communityOnly = false,
  region,
}: SectionInfiniteListProps) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(Boolean(initialCursor));
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || !cursor) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        section: sectionSlug,
        cursor,
        communityOnly: communityOnly ? "1" : "0",
      });
      if (region) params.set("region", region);
      const res = await fetch(`/api/posts/feed?${params}`);
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
  }, [hasMore, loading, cursor, sectionSlug, communityOnly, region]);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading: loading,
    onLoadMore: loadMore,
  });

  if (items.length === 0) {
    return (
      <EmptyState
        title="아직 글이 없습니다"
        description="이 게시판의 첫 글을 작성해 보세요."
        actionHref={getWriteHref(sectionSlug)}
        actionLabel="글쓰기"
      />
    );
  }

  return (
    <div>
      {items.map((post, i) => (
        <FadeInUp key={post.id} delayMs={i < 8 ? i * 30 : 0}>
          <TextListItem item={post} />
        </FadeInUp>
      ))}
      {hasMore && (
        <div ref={sentinelRef} className="px-2 py-4">
          {loading ? (
            <div className="space-y-2">
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
    </div>
  );
}
