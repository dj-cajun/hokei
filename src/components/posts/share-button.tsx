"use client";

import { Share2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type ShareButtonProps = {
  title: string;
  className?: string;
};

export function ShareButton({ title, className }: ShareButtonProps) {
  const { showToast } = useToast();

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("링크가 복사되었습니다.");
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        showToast("링크가 복사되었습니다.");
      } catch {
        showToast("공유에 실패했습니다.", "error");
      }
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-card-hover",
        className
      )}
      aria-label="공유하기"
    >
      <Share2 className="h-4 w-4" />
      <span className="hidden sm:inline">공유</span>
    </button>
  );
}
