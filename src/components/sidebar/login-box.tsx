"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoginTrigger } from "@/components/auth/login-trigger";
import { socialSignOut } from "@/lib/auth/social-sign-out";
import { LayoutDashboard, LogOut, Mail, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginBox() {
  const { data: session } = useSession();

  if (session?.user) {
    return (
      <div className="rounded-2xl bg-surface p-4">
        <p className="text-sm font-medium text-foreground">
          {session.user.name}님
        </p>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
        <div className="mt-3 flex flex-col gap-2">
          {session.user.role === "ADMIN" && (
            <Button variant="outline" className="w-full gap-2" asChild>
              <Link href="/admin">
                <LayoutDashboard className="h-4 w-4" />
                관리자 대시보드
              </Link>
            </Button>
          )}
          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/messages">
              <Mail className="h-4 w-4" />
              쪽지함
            </Link>
          </Button>
          <Button variant="outline" className="w-full gap-2" asChild>
            <Link href="/profile">
              <PenLine className="h-4 w-4" />
              내 프로필
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full gap-2"
            onClick={() => void socialSignOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-sm text-muted-foreground">
        로그인하고 글을 작성해 보세요
      </p>
      <div className="mt-3 flex flex-col gap-2">
        <LoginTrigger asChild>
          <Button className="w-full">로그인</Button>
        </LoginTrigger>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/signup">회원가입</Link>
        </Button>
      </div>
    </div>
  );
}
