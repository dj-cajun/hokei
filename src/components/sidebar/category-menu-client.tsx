"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";
import type { CategoryNavItem } from "@/lib/categories";
import {
  buildSiteNavGroups,
  isLifeInfoPath,
  isSiteFeaturePath,
} from "@/lib/site-navigation";
import { useMounted } from "@/lib/use-mounted";

interface CategoryMenuClientProps {
  tree: CategoryNavItem[];
}

const EXPANDABLE_SECTION_SLUGS = new Set(["life", "life-info", "news"]);

export function CategoryMenuClient({ tree }: CategoryMenuClientProps) {
  const pathname = usePathname();
  const mounted = useMounted();
  const groups = buildSiteNavGroups(tree);

  function isActive(href: string, sectionSlug?: string) {
    if (!mounted) return false;
    if (href === "/") return pathname === "/";
    if (sectionSlug === "life-info") return isLifeInfoPath(pathname);
    if (href === "/life" || href === "/life/study") {
      return isSiteFeaturePath(pathname);
    }
    if (href === "/news")
      return pathname === "/news" || pathname.startsWith("/news/");
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav className="rounded-2xl bg-surface p-2" aria-label="카테고리">
      <ul className="flex flex-col gap-0.5">
        <li>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              mounted && pathname === "/" && !isSiteFeaturePath(pathname)
                ? "bg-accent text-primary"
                : "text-foreground hover:bg-secondary"
            )}
          >
            <LayoutGrid className="h-5 w-5 shrink-0" />
            <span>홈</span>
          </Link>
        </li>

        {groups.map((group) => (
          <li key={group.id} className="mt-2">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((section) => {
                const SectionIcon = getCategoryIcon(section.icon);
                const sectionActive = isActive(section.href, section.slug);
                const showChildren =
                  mounted &&
                  section.children.length > 0 &&
                  EXPANDABLE_SECTION_SLUGS.has(section.slug);

                return (
                  <li key={section.id}>
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
                    {showChildren && (
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
                              {child.children.length > 0 && (
                                <ul className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border/70 pl-2">
                                  {child.children.map((grandchild) => {
                                    const GrandIcon = getCategoryIcon(
                                      grandchild.icon
                                    );
                                    const grandActive = isActive(grandchild.href);

                                    return (
                                      <li key={grandchild.id}>
                                        <Link
                                          href={grandchild.href}
                                          title={
                                            grandchild.description ?? undefined
                                          }
                                          className={cn(
                                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
                                            grandActive
                                              ? "bg-accent/70 text-primary"
                                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                          )}
                                        >
                                          <GrandIcon className="h-3 w-3 shrink-0" />
                                          <span className="line-clamp-2">
                                            {grandchild.label}
                                          </span>
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
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
