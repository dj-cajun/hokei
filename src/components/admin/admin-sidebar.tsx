"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FolderTree,
  LayoutDashboard,
  Newspaper,
  PenLine,
  Shield,
  ShieldAlert,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/use-mounted";

const navItems = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard },
  { href: "/admin/moderation", label: "모더레이션", icon: Shield },
  { href: "/admin/categories", label: "카테고리", icon: FolderTree },
  { href: "/admin/curate", label: "콘텐츠 재가공", icon: PenLine },
  { href: "/admin/ai-curate", label: "AI 카톡 큐레이션", icon: Sparkles },
  { href: "/admin/life", label: "생활 가이드", icon: BookOpen },
  { href: "/admin/partners", label: "제휴 업소", icon: Store },
  { href: "/admin/ingest", label: "뉴스 수집", icon: Newspaper },
  { href: "/admin/security", label: "보안·감사", icon: ShieldAlert },
  { href: "/admin/users", label: "회원 관리", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const mounted = useMounted();

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <div className="rounded-2xl bg-surface p-3">
        <Link
          href="/"
          className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          사이트로 돌아가기
        </Link>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          관리자
        </p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              mounted &&
              (item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-primary"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
