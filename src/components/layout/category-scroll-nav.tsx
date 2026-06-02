"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryNavPopoverTab } from "@/components/layout/category-nav-popover-tab";
import type { CategoryPopoverItem } from "@/components/layout/category-nav-popover-tab";
import { isNewsSectionPath, NEWS_BOARD_ITEMS } from "@/lib/news-boards-config";
import { cn } from "@/lib/utils";
import type { CategoryNavItem } from "@/lib/categories";

const homeTab = { href: "/", label: "홈" } as const;

interface CategoryScrollNavProps {
  sections: CategoryNavItem[];
}

function getDropdownItems(section: CategoryNavItem): CategoryPopoverItem[] {
  if (section.slug === "news") {
    return NEWS_BOARD_ITEMS.map((b) => ({
      label: b.title,
      href: b.href,
    }));
  }
  return section.children.map((c) => ({
    label: c.label,
    href: c.href,
  }));
}

function isSectionActive(
  pathname: string,
  section: CategoryNavItem,
  items: CategoryPopoverItem[]
): boolean {
  if (section.slug === "news") return isNewsSectionPath(pathname);
  if (pathname === section.href || pathname.startsWith(`${section.href}/`)) {
    return true;
  }
  return items.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
}

export function CategoryScrollNav({ sections }: CategoryScrollNavProps) {
  const pathname = usePathname();
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  useEffect(() => {
    setOpenSlug(null);
  }, [pathname]);

  const sectionDropdowns = useMemo(
    () =>
      sections.map((section) => ({
        section,
        items: getDropdownItems(section),
      })),
    [sections]
  );

  return (
    <nav
      className="relative z-40 border-t border-gray-200 bg-white"
      aria-label="카테고리 탭"
    >
      <div
        className={cn(
          "scrollbar-none mx-auto flex max-w-md gap-0 overflow-x-auto overflow-y-visible whitespace-nowrap px-1",
          "lg:max-w-6xl lg:justify-center lg:overflow-visible lg:px-4"
        )}
      >
        <Link
          href={homeTab.href}
          className={cn(
            "shrink-0 border-b-2 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-0",
            pathname === "/"
              ? "border-primary font-bold text-primary"
              : "border-transparent font-medium text-gray-500 hover:text-foreground"
          )}
        >
          {homeTab.label}
        </Link>

        {sectionDropdowns.map(({ section, items }) => {
          const active = isSectionActive(pathname, section, items);
          const isOpen = openSlug === section.slug;

          if (items.length === 0) {
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-0",
                  active
                    ? "border-primary font-bold text-primary"
                    : "border-transparent font-medium text-gray-500 hover:text-foreground"
                )}
              >
                {section.label}
              </Link>
            );
          }

          return (
            <CategoryNavPopoverTab
              key={section.id}
              label={section.label}
              items={items}
              open={isOpen}
              active={active}
              onToggle={() =>
                setOpenSlug((prev) =>
                  prev === section.slug ? null : section.slug
                )
              }
              onClose={() => setOpenSlug(null)}
            />
          );
        })}
      </div>
    </nav>
  );
}
