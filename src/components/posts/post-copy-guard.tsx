"use client";

import { cn } from "@/lib/utils";

type PostCopyGuardProps = {
  children: React.ReactNode;
  className?: string;
};

/** 게시글 상세 — 드래그·Ctrl+C 복사만 가볍게 억제 (완전 방지 아님) */
export function PostCopyGuard({ children, className }: PostCopyGuardProps) {
  return (
    <div
      className={cn("select-none", className)}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
