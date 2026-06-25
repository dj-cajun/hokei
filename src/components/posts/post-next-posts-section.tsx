"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TextListItem } from "@/components/home/news-list-item";
import type { FeedItem } from "@/types/feed";

type PostNextPostsSectionProps = {
  categoryLabel: string;
  categoryHref: string;
  items: FeedItem[];
};

export function PostNextPostsSection({
  categoryLabel,
  categoryHref,
  items,
}: PostNextPostsSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-4 border-t border-border-light pt-4">
      <div className="mb-1 flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-bold text-foreground">
          {categoryLabel} 다음 글
        </h2>
        <Link
          href={categoryHref}
          className="flex shrink-0 items-center text-[11px] font-medium text-primary hover:underline"
        >
          전체 보기
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div>
        {items.map((item) => (
          <TextListItem key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
