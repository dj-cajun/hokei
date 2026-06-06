import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "내 프로필 - 호케이 Hokei",
  robots: { index: false, follow: false },
};
import { LayoutDashboard, Mail, Shield } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ProfilePage() {
  const session = await requireAuth();
  const { user } = session;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-white p-6 md:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
              {user.name.charAt(0)}
            </span>
            <div>
              <h1 className="text-xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
                  user.role === "ADMIN"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {user.role === "ADMIN" ? (
                  <>
                    <Shield className="h-3 w-3" />
                    관리자
                  </>
                ) : (
                  "일반 회원"
                )}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href="/messages">
                <Mail className="mr-2 h-4 w-4" />
                쪽지함
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-secondary/60 p-4">
              <p className="text-xs text-muted-foreground">계정 ID</p>
              <p className="mt-1 truncate text-sm font-mono">{user.id}</p>
            </div>
            <div className="rounded-xl bg-secondary/60 p-4">
              <p className="text-xs text-muted-foreground">권한</p>
              <p className="mt-1 text-sm font-medium">
                {user.role === "ADMIN" ? "관리자 (ADMIN)" : "일반 (USER)"}
              </p>
            </div>
          </div>

          {user.role === "ADMIN" && (
            <div className="mt-6">
              <Button asChild>
                <Link href="/admin">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  관리자 대시보드 열기
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
