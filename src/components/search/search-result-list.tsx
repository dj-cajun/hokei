"use client";

import Link from "next/link";
import type { FeedItem } from "@/types/feed";
import { splitHighlight } from "@/lib/search/highlight";

type SearchResultListProps = {
  items: FeedItem[];
  query: string;
};

export function SearchResultList({ items, query }: SearchResultListProps) {
  return (
    <div>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/posts/${item.id}`}
          className="flex gap-3 border-b border-border-light px-3 py-3 transition-colors hover:bg-card-hover"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-muted-foreground">{item.category}</p>
            <p className="line-clamp-2 text-sm font-medium leading-snug">
              {splitHighlight(item.title, query).map((p, i) =>
                p.mark ? (
                  <mark
                    key={i}
                    className="rounded-sm bg-amber-100 px-0.5 dark:bg-amber-900/50"
                  >
                    {p.text}
                  </mark>
                ) : (
                  <span key={i}>{p.text}</span>
                )
              )}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {item.dateLabel} · 조회 {item.views}
              {item.comments > 0 ? ` · 댓글 ${item.comments}` : ""}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
