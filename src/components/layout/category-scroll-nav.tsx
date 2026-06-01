"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CategoryNavItem } from "@/lib/categories";

const extraTabs = [{ href: "/", label: "홈" }];

interface CategoryScrollNavProps {
  sections: CategoryNavItem[];
}

export function CategoryScrollNav({ sections }: CategoryScrollNavProps) {
  const pathname = usePathname();

  const tabs = [
    ...extraTabs,
    ...sections.map((s) => ({ href: s.href, label: s.label })),
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      className="border-t border-[#e5e7eb] bg-white lg:hidden"
      aria-label="카테고리 탭"
    >
      <div className="scrollbar-none mx-auto flex max-w-md overflow-x-auto whitespace-nowrap">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-primary font-bold text-primary"
                  : "border-transparent font-medium text-gray-500 hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
