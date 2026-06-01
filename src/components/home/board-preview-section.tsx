"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NewBadge } from "@/components/ui/new-badge";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { cn } from "@/lib/utils";
import { isWritableSection } from "@/lib/write-sections";
import type { BoardPreviewSection } from "@/types/feed";

export function BoardPreviewSectionBox({ section }: { section: BoardPreviewSection }) {
  const tabs = section.tabs ?? [{ id: "all", label: "전체" }];
  const [activeTab, setActiveTab] = useState(tabs[0]!.id);

  return (
    <section className="bg-white">
      <header className="flex items-center justify-between border-b border-gray-50 px-3 py-2">
        <h2 className="text-sm font-bold text-gray-900">{section.title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {isWritableSection(section.href.replace(/^\//, "")) && (
            <SectionWriteLink
              sectionSlug={section.href.replace(/^\//, "")}
              compact
            />
          )}
          <Link
            href={section.href}
            className="flex items-center gap-0.5 text-[11px] text-gray-400"
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
                  ? "bg-[#0f172a] text-white"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <ul>
        {section.items.map((item) => (
            <li key={item.id} className="border-b border-gray-50 last:border-b-0">
              <Link
                href={item.href}
                className="flex items-center justify-between gap-2 px-3 py-1.5 active:bg-gray-50"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
                  {item.isNew && <NewBadge />}
                  {item.title}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                  {item.views != null
                    ? `조회 ${item.views}`
                    : item.dateLabel}
                </span>
              </Link>
            </li>
          ))}
      </ul>
    </section>
  );
}
