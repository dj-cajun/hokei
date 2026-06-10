"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { NewsListItem, TextListItem } from "@/components/home/news-list-item";
import type { FeedItem, FeedTab } from "@/types/feed";
import { shouldShowFeedThumbnail } from "@/lib/news/feed-thumbnail";

const tabs: { id: FeedTab; label: string }[] = [
  { id: "latest", label: "최신글" },
  { id: "popular", label: "인기글" },
  { id: "notice", label: "공지" },
];

interface FeedListClientProps {
  latest: FeedItem[];
  popular: FeedItem[];
  notices: FeedItem[];
}

export function FeedListClient({
  latest,
  popular,
  notices,
}: FeedListClientProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("latest");

  const items =
    activeTab === "notice"
      ? notices
      : activeTab === "popular"
        ? popular
        : latest;

  const isNoticeTab = activeTab === "notice";

  return (
    <section className="bg-white">
      <div
        className="flex border-b border-[#e5e7eb]"
        role="tablist"
        aria-label="피드 탭"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 border-b-2 px-2 py-2 text-sm transition-colors",
              activeTab === tab.id
                ? "border-primary font-bold text-primary"
                : "border-transparent font-medium text-gray-500"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="space-y-0" role="tabpanel">
        {items.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-gray-400">
            {activeTab === "popular"
              ? "아직 추천이 많은 글이 없습니다. 마음에 드는 글에 좋아요를 눌러 보세요."
              : "표시할 글이 없습니다. 매일 오전 7시(호치민)에 뉴스가 자동 수집됩니다."}
          </p>
        ) : (
          items.map((item) =>
            isNoticeTab || !shouldShowFeedThumbnail(item) ? (
              <TextListItem key={item.id} item={item} />
            ) : (
              <NewsListItem key={item.id} item={item} />
            )
          )
        )}
      </div>
    </section>
  );
}
