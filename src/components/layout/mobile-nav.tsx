"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCategoryIcon } from "@/lib/category-icons";
import {
  isMobileNavItemActive,
  MOBILE_NAV_ITEMS,
} from "@/lib/mobile-nav-config";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (
    pathname === "/write" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/messages") ||
    /\/posts\/[^/]+\/edit$/.test(pathname)
  ) {
    return null;
  }

  // 서버 HTML과 클라이언트 첫 렌더를 동일하게 — HMR/캐시 불일치 시 하이드레이션 오류 방지
  if (!mounted) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85 lg:hidden"
        aria-hidden
      >
        <ul className="mx-auto flex h-12 max-w-[480px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]" />
      </nav>
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-surface/90 backdrop-blur-md supports-[backdrop-filter]:bg-surface/85 lg:hidden"
      aria-label="모바일 하단 메뉴"
    >
      <ul className="mx-auto flex h-12 max-w-[480px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = getCategoryIcon(item.icon);
          const isActive = isMobileNavItemActive(item, pathname);

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0 px-0.5 py-1 text-[10px] leading-none transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive ? "font-bold text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                <span className="mt-0.5 truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
