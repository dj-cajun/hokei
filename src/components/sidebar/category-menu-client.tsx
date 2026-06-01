"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";
import type { CategoryNavItem } from "@/lib/categories";

interface CategoryMenuClientProps {
  tree: CategoryNavItem[];
}

export function CategoryMenuClient({ tree }: CategoryMenuClientProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="rounded-2xl bg-white p-2" aria-label="카테고리">
      <ul className="flex flex-col gap-0.5">
        <li>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-accent text-primary"
                : "text-foreground hover:bg-secondary"
            )}
          >
            <LayoutGrid className="h-5 w-5 shrink-0" />
            <span>전체글</span>
          </Link>
        </li>

        {tree.map((section) => {
          const SectionIcon = getCategoryIcon(section.icon);
          const sectionActive = isActive(section.href);

          return (
            <li key={section.id} className="mt-1">
              <Link
                href={section.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  sectionActive
                    ? "bg-accent text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <SectionIcon className="h-5 w-5 shrink-0" />
                <span>{section.label}</span>
              </Link>
              {section.children.length > 0 && (
                <ul className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2">
                  {section.children.map((child) => {
                    const ChildIcon = getCategoryIcon(child.icon);
                    const childActive = isActive(child.href);

                    return (
                      <li key={child.id}>
                        <Link
                          href={child.href}
                          title={child.description ?? undefined}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                            childActive
                              ? "bg-accent/80 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                        >
                          <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2">{child.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
