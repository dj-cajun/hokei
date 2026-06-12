"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void | Promise<void>;
  rootMargin?: string;
};

/** 목록 하단 sentinel이 보이면 onLoadMore 호출 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = "200px",
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  const setSentinelRef = useCallback((el: HTMLDivElement | null) => {
    sentinelRef.current = el;
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void onLoadMore();
        }
      },
      { rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [node, hasMore, isLoading, onLoadMore, rootMargin]);

  return { sentinelRef: setSentinelRef };
}
