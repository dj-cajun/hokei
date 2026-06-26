"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoginTrigger } from "@/components/auth/login-trigger";
import { socialSignOut } from "@/lib/auth/social-sign-out";
import { LayoutDashboard, LogOut, Mail, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="hidden h-10 w-20 animate-pulse rounded-xl bg-secondary lg:block" />
    );
  }

  if (!session?.user) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <LoginTrigger asChild>
          <Button variant="ghost">로그인</Button>
        </LoginTrigger>
        <Button asChild>
          <Link href="/signup">회원가입</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-2 lg:flex">
      {session.user.role === "ADMIN" && (
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">
            <LayoutDashboard className="mr-1 h-4 w-4" />
            관리자
          </Link>
        </Button>
      )}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/account">
          <Users className="mr-1 h-4 w-4" />
          회원 관리
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/messages">
          <Mail className="mr-1 h-4 w-4" />
          쪽지
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/profile">
          <User className="mr-1 h-4 w-4" />
          {session.user.name}
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => void socialSignOut({ callbackUrl: "/" })}
      >
        <LogOut className="mr-1 h-4 w-4" />
        로그아웃
      </Button>
    </div>
  );
}
