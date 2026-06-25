"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryNavPopoverTab } from "@/components/layout/category-nav-popover-tab";
import {
  getHeaderDropdownItems,
  isSiteFeaturePath,
  normalizeNavPath,
  resolveActiveHeaderSectionSlug,
} from "@/lib/site-navigation";
import { cn } from "@/lib/utils";
import type { CategoryNavItem } from "@/lib/categories";

const homeTab = { href: "/", label: "홈" } as const;

interface CategoryScrollNavProps {
  sections: CategoryNavItem[];
}

function CategoryScrollNavBody({
  sections,
  pathname,
}: {
  sections: CategoryNavItem[];
  pathname: string;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const normalizedPath = normalizeNavPath(pathname);

  useEffect(() => {
    setOpenSlug(null);
  }, [normalizedPath]);

  const sectionDropdowns = useMemo(
    () =>
      sections.map((section) => ({
        section,
        items: getHeaderDropdownItems(section),
      })),
    [sections]
  );

  const pathActiveSlug = resolveActiveHeaderSectionSlug(
    normalizedPath,
    sections
  );
  const highlightedSlug = openSlug ?? pathActiveSlug;
  const homeActive =
    !openSlug &&
    normalizedPath === "/" &&
    !isSiteFeaturePath(normalizedPath);

  return (
    <nav
      className="relative z-40 border-t border-border bg-surface"
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
            "shrink-0 border-b-2 px-3 py-2 text-sm transition-colors focus-ring",
            homeActive
              ? "border-primary font-bold text-primary"
              : "border-transparent font-medium text-muted-foreground hover:text-foreground"
          )}
        >
          {homeTab.label}
        </Link>

        {sectionDropdowns.map(({ section, items }) => {
          const active = highlightedSlug === section.slug;
          const isOpen = openSlug === section.slug;

          if (items.length === 0) {
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  "shrink-0 border-b-2 px-3 py-2 text-sm transition-colors focus-ring",
                  active
                    ? "border-primary font-bold text-primary"
                    : "border-transparent font-medium text-muted-foreground hover:text-foreground"
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

export function CategoryScrollNav({ sections }: CategoryScrollNavProps) {
  const pathname = usePathname();
  return (
    <CategoryScrollNavBody sections={sections} pathname={pathname} />
  );
}
