"use client";

import { useSession } from "next-auth/react";
import { LoginTrigger } from "@/components/auth/login-trigger";
import { Button } from "@/components/ui/button";

/** 모바일 헤더 — 비로그인 시 로그인 모달 */
export function GuestHeaderLogin() {
  const { data: session, status } = useSession();

  if (status === "loading" || session?.user) return null;

  return (
    <LoginTrigger asChild>
      <Button
        size="sm"
        className="h-8 shrink-0 px-2.5 text-xs font-semibold lg:hidden"
      >
        로그인
      </Button>
    </LoginTrigger>
  );
}
