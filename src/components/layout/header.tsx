"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CategoryScrollNav } from "@/components/layout/category-scroll-nav";
import { HeaderSearch } from "@/components/layout/header-search";
import { SiteLogo } from "@/components/layout/site-logo";
import { CategoryMenuClient } from "@/components/sidebar/category-menu-client";
import { LoginBox } from "@/components/sidebar/login-box";
import { WidgetsLoader } from "@/components/widgets/widgets-loader";
import { GuestHeaderLogin } from "@/components/layout/guest-header-login";
import { HeaderMessagesLink } from "@/components/layout/header-messages-link";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { CategoryNavItem } from "@/lib/categories";

interface HeaderProps {
  categoryTree: CategoryNavItem[];
}

export function Header({ categoryTree }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const menuOpen = menuOpenedAt === pathname;

  if (pathname === "/write" || /\/posts\/[^/]+\/edit$/.test(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex h-11 max-w-[480px] items-center gap-2 px-3 lg:h-14 lg:max-w-6xl lg:gap-3 lg:px-4">
        <SiteLogo compact={!isHome} />

        <Suspense fallback={<div className="h-8 flex-1 lg:hidden" />}>
          <HeaderSearch variant="mobile" />
        </Suspense>
        <Suspense fallback={<div className="hidden h-9 flex-1 lg:block" />}>
          <HeaderSearch variant="desktop" />
        </Suspense>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="relative hidden h-8 w-8 sm:flex"
            aria-label="알림"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#c8102e]" />
          </Button>

          <ThemeToggle />
          <HeaderMessagesLink />
          <GuestHeaderLogin />
          <UserMenu />

          <Sheet
            open={menuOpen}
            onOpenChange={(open) => setMenuOpenedAt(open ? pathname : null)}
          >
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:hidden"
                aria-label="메뉴 열기"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent title="사이트 메뉴" className="overflow-y-auto p-3 pt-12">
              <div
                className="flex flex-col gap-2"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a, button")) {
                    setMenuOpenedAt(null);
                  }
                }}
              >
                <LoginBox />
                <CategoryMenuClient tree={categoryTree} />
                <WidgetsLoader variant="weather" />
                <WidgetsLoader variant="exchange" />
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2">
                  <span className="text-sm font-medium">화면 테마</span>
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {!isHome && <CategoryScrollNav sections={categoryTree} />}
    </header>
  );
}
