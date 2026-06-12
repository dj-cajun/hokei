"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NewBadge } from "@/components/ui/new-badge";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { formatViewsComments } from "@/lib/format/post-list-meta";
import { cn } from "@/lib/utils";
import { isWritableSection } from "@/lib/write-sections";
import type { BoardPreviewItem, BoardPreviewSection } from "@/types/feed";

const cardLinkClass =
  "block rounded-xl border border-border bg-surface p-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-card-hover hover:shadow-md active:bg-muted";

function BoardPreviewMeta({ item }: { item: BoardPreviewItem }) {
  return (
    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
      {item.views != null
        ? formatViewsComments(item.views, item.commentCount ?? 0)
        : `${item.dateLabel} · 댓글 ${(item.commentCount ?? 0).toLocaleString()}`}
    </span>
  );
}

function BoardPreviewTitle({ item }: { item: BoardPreviewItem }) {
  return (
    <span className="min-w-0 text-sm text-foreground">
      {item.isNew && <NewBadge />}
      {item.title}
    </span>
  );
}

export function BoardPreviewSectionBox({ section }: { section: BoardPreviewSection }) {
  const tabs = section.tabs ?? [{ id: "all", label: "전체" }];
  const [activeTab, setActiveTab] = useState(tabs[0]!.id);

  return (
    <section className="bg-surface lg:rounded-xl lg:border lg:border-border">
      <header className="flex items-center justify-between border-b border-border-light px-3 py-2">
        <h2 className="text-sm font-bold text-foreground">{section.title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {isWritableSection(section.href.replace(/^\//, "")) && (
            <SectionWriteLink
              sectionSlug={section.href.replace(/^\//, "")}
              compact
            />
          )}
          <Link
            href={section.href}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground"
          >
            더보기
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </header>

      {tabs.length > 1 && (
        <div className="flex gap-1.5 px-3 py-2" role="tablist">
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
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 모바일 — 리스트 */}
      <ul className="lg:hidden">
        {section.items.map((item) => (
          <li key={item.id} className="border-b border-border-light last:border-b-0">
            <Link
              href={item.href}
              className="flex items-center justify-between gap-2 px-3 py-1.5 active:bg-muted"
            >
              <span className="min-w-0 flex-1 truncate">
                <BoardPreviewTitle item={item} />
              </span>
              <BoardPreviewMeta item={item} />
            </Link>
          </li>
        ))}
      </ul>

      {/* 데스크톱 — 그리드 카드 */}
      <ul className="hidden gap-3 p-3 lg:grid lg:grid-cols-2">
        {section.items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className={cardLinkClass}>
              <p className="line-clamp-2 font-medium leading-snug">
                <BoardPreviewTitle item={item} />
              </p>
              <p className="mt-2">
                <BoardPreviewMeta item={item} />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
