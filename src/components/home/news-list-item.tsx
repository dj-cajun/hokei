"use client";

import Link from "next/link";
import { NewsThumbnail } from "@/components/news/thumbnail";
import { NewBadge } from "@/components/ui/new-badge";
import type { FeedItem } from "@/types/feed";

export function NewsListItem({ item }: { item: FeedItem }) {
  const hasThumb = Boolean(item.thumbnail || item.sourceUrl);

  return (
    <article className="border-b border-gray-50 last:border-b-0">
      <Link
        href={`/posts/${item.id}`}
        className="flex gap-2 px-3 py-2 active:bg-gray-50"
      >
        {hasThumb && (
          <div className="h-[60px] w-20 shrink-0 overflow-hidden rounded-sm bg-secondary">
            <NewsThumbnail
              src={item.thumbnail}
              sourceUrl={item.sourceUrl}
              topic={item.topic}
              className="aspect-[4/3] h-[60px] w-20 rounded-sm object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {item.isNew && <NewBadge className="align-middle" />}
            {item.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400">
            <time dateTime={item.dateLabel}>{item.dateLabel}</time>
            <span aria-hidden>·</span>
            <span>조회 {item.views.toLocaleString()}</span>
          </p>
        </div>
      </Link>
    </article>
  );
}

/** 썸네일 없는 공지·텍스트 목록 */
export function TextListItem({ item }: { item: FeedItem }) {
  return (
    <article className="border-b border-gray-50 last:border-b-0">
      <Link
        href={`/posts/${item.id}`}
        className="flex items-center justify-between gap-2 px-3 py-1.5 active:bg-gray-50"
      >
        <span className="flex min-w-0 flex-1 items-center gap-1">
          {item.isNew && <NewBadge />}
          <span className="truncate text-sm font-medium leading-snug text-foreground">
            {item.title}
          </span>
        </span>
        <span className="shrink-0 text-[11px] text-gray-400">
          {item.dateLabel}
        </span>
      </Link>
    </article>
  );
}
