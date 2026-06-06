"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 모바일 헤더 — 로그인 시 쪽지함 바로가기 */
export function HeaderMessagesLink() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status !== "authenticated" || !session?.user) return null;

  const active = pathname.startsWith("/messages");

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 lg:hidden", active && "text-primary")}
      asChild
    >
      <Link href="/messages" aria-label="쪽지함">
        <Mail className="h-4 w-4" />
      </Link>
    </Button>
  );
}
