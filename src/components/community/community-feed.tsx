"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { TextListItem } from "@/components/home/news-list-item";
import type { FeedItem, FeedTab } from "@/types/feed";

const tabs: { id: FeedTab; label: string }[] = [
  { id: "latest", label: "최신글" },
  { id: "popular", label: "인기글" },
  { id: "notice", label: "공지" },
];

type CommunityFeedProps = {
  latest: FeedItem[];
  popular: FeedItem[];
  notices: FeedItem[];
};

export function CommunityFeed({
  latest,
  popular,
  notices,
}: CommunityFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("latest");
  const items =
    activeTab === "notice"
      ? notices
      : activeTab === "popular"
        ? popular
        : latest;

  return (
    <div className="bg-white">
      <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h1 className="text-base font-bold text-gray-900">커뮤니티</h1>
          <p className="mt-0.5 text-xs text-gray-500">
            교민 자유게시 · 생존 Q&A · 업소록
          </p>
        </div>
        <SectionWriteLink sectionSlug="community" />
      </header>

      <div className="flex gap-1.5 px-4 py-2" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[#0f172a] text-white"
                : "bg-gray-100 text-gray-500"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ul>
        {items.length === 0 ? (
          <li className="px-4 py-8 text-center text-xs text-gray-400">
            {activeTab === "notice"
              ? "등록된 공지가 없습니다."
              : "아직 글이 없습니다. 첫 글을 작성해 보세요."}
          </li>
        ) : (
          items.map((item) => <TextListItem key={item.id} item={item} />)
        )}
      </ul>
    </div>
  );
}
