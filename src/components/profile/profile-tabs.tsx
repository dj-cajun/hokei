"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tab = { id: string; label: string; content: ReactNode };

export function ProfileTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div className="mt-8">
      <div
        className="flex border-b border-border"
        role="tablist"
        aria-label="프로필 탭"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "flex-1 border-b-2 px-3 py-2 text-sm transition-colors",
              active === tab.id
                ? "border-primary font-bold text-primary"
                : "border-transparent font-medium text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4" role="tabpanel">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}
