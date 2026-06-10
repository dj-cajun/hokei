"use client";

import Link from "next/link";
import { NewsThumbnail } from "@/components/news/thumbnail";
import { NewBadge } from "@/components/ui/new-badge";
import { formatViewsComments } from "@/lib/format/post-list-meta";
import { shouldShowFeedThumbnail } from "@/lib/news/feed-thumbnail";
import type { FeedItem } from "@/types/feed";

function PostListMeta({ item }: { item: FeedItem }) {
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
      <time dateTime={item.dateLabel}>{item.dateLabel}</time>
      <span aria-hidden>·</span>
      <span>{formatViewsComments(item.views, item.comments, item.likes)}</span>
    </p>
  );
}

export function NewsListItem({ item }: { item: FeedItem }) {
  const hasThumb = shouldShowFeedThumbnail(item);

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
          <PostListMeta item={item} />
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
        className="block px-3 py-2 active:bg-gray-50"
      >
        <h3 className="flex min-w-0 items-center gap-1 text-sm font-medium leading-snug text-foreground">
          {item.isNew && <NewBadge />}
          <span className="line-clamp-2">{item.title}</span>
        </h3>
        <PostListMeta item={item} />
      </Link>
    </article>
  );
}
