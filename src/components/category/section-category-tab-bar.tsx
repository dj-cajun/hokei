"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SectionCategoryTab } from "@/lib/section-category-tabs";
import { cn } from "@/lib/utils";

export type { SectionCategoryTab };

type SectionCategoryTabBarProps = {
  sectionHref: string;
  tabs: SectionCategoryTab[];
};

function normalizePath(path: string): string {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

function resolveActiveSectionTab(
  pathname: string,
  sectionHref: string,
  tabs: SectionCategoryTab[]
): { all: boolean; activeHref: string | null } {
  const path = normalizePath(pathname);
  const section = normalizePath(sectionHref);

  if (path === section) {
    return { all: true, activeHref: null };
  }

  let activeHref: string | null = null;
  for (const tab of tabs) {
    const tabPath = normalizePath(tab.href);
    if (path === tabPath || path.startsWith(`${tabPath}/`)) {
      if (!activeHref || tabPath.length > activeHref.length) {
        activeHref = tabPath;
      }
    }
  }

  return { all: false, activeHref };
}

export function SectionCategoryTabBar({
  sectionHref,
  tabs,
}: SectionCategoryTabBarProps) {
  const pathname = usePathname();
  const { all, activeHref } = resolveActiveSectionTab(
    pathname,
    sectionHref,
    tabs
  );

  return (
    <div
      className="border-b border-border-light px-2 py-2"
      role="tablist"
      aria-label="게시판 분류"
    >
      <div className="flex flex-wrap gap-1">
        <TabLink href={sectionHref} active={all}>
          전체
        </TabLink>
        {tabs.map((tab) => {
          const tabPath = normalizePath(tab.href);
          return (
            <TabLink
              key={tab.href}
              href={tab.href}
              active={!all && activeHref === tabPath}
            >
              {tab.label}
            </TabLink>
          );
        })}
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
        active
          ? "bg-primary text-white"
          : "bg-secondary/80 text-muted-foreground hover:bg-card-hover"
      )}
    >
      {children}
    </Link>
  );
}
