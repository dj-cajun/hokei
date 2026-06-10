"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  Home,
  MessageCircle,
  Newspaper,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "홈", icon: Home },
  { href: "/news", label: "뉴스", icon: Newspaper },
  { href: "/real-estate", label: "부동산", icon: Building2 },
  { href: "/jobs", label: "구인", icon: Briefcase },
  { href: "/community", label: "커뮤니티", icon: MessageCircle },
  { href: "/profile", label: "내 정보", icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  if (
    pathname === "/write" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/messages") ||
    /\/posts\/[^/]+\/edit$/.test(pathname)
  ) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/85 lg:hidden"
      aria-label="모바일 하단 메뉴"
    >
      <ul className="mx-auto flex h-12 max-w-[480px] items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0 px-0.5 py-1 text-[10px] leading-none transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  isActive ? "font-bold text-primary" : "text-gray-400"
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
