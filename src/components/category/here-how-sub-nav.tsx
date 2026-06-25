"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HERE_HOW_HREF } from "@/lib/here-how";
import { cn } from "@/lib/utils";

const HERE_HOW_LEAVES = [
  { label: "배고플때", href: "/promo/store/hungry" },
  { label: "불편할때", href: "/promo/store/inconvenient" },
] as const;

export function HereHowSubNav() {
  const pathname = usePathname();
  const isAll = pathname === HERE_HOW_HREF;

  return (
    <div
      className="mt-3 flex flex-wrap gap-1.5"
      role="tablist"
      aria-label="여기 어때 하위 카테고리"
    >
      <Link
        href={HERE_HOW_HREF}
        role="tab"
        aria-selected={isAll}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          isAll
            ? "bg-primary text-white"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        )}
      >
        전체
      </Link>
      {HERE_HOW_LEAVES.map((child) => {
        const active =
          pathname === child.href || pathname.startsWith(`${child.href}/`);
        return (
          <Link
            key={child.href}
            href={child.href}
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {child.label}
          </Link>
        );
      })}
    </div>
  );
}
