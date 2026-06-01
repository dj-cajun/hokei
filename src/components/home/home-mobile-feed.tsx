"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { NewsListItem, TextListItem } from "@/components/home/news-list-item";
import type { FeedItem, FeedTab } from "@/types/feed";

const tabs: { id: FeedTab; label: string }[] = [
  { id: "latest", label: "최신글" },
  { id: "popular", label: "인기글" },
  { id: "notice", label: "공지" },
];

export function HomeMobileFeed({
  latest,
  popular,
  notices,
}: {
  latest: FeedItem[];
  popular: FeedItem[];
  notices: FeedItem[];
}) {
  const [activeTab, setActiveTab] = useState<FeedTab>("latest");
  const items =
    activeTab === "notice"
      ? notices
      : activeTab === "popular"
        ? popular
        : latest;

  return (
    <section className="bg-white">
      <header className="flex items-center justify-between border-b border-gray-50 px-3 py-2">
        <h2 className="text-sm font-bold text-[#c8102e]">커뮤니티</h2>
        <SectionWriteLink sectionSlug="community" compact />
      </header>
      <div className="flex gap-1.5 px-3 py-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              activeTab === tab.id
                ? "bg-[#0f172a] text-white"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {items.length === 0 ? (
          <p className="px-3 py-3 text-center text-xs text-gray-400">글이 없습니다.</p>
        ) : (
          items.slice(0, 8).map((item) =>
            activeTab === "notice" || !item.thumbnail ? (
              <TextListItem key={item.id} item={item} />
            ) : (
              <NewsListItem key={item.id} item={item} />
            )
          )
        )}
      </div>
      <Link
        href="/community"
        className="block border-t border-gray-50 py-2 text-center text-[11px] text-gray-500"
      >
        더보기
      </Link>
    </section>
  );
}
