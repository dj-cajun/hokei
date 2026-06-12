"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type BookmarkButtonProps = {
  postId: string;
  initialBookmarked?: boolean;
};

export function BookmarkButton({
  postId,
  initialBookmarked = false,
}: BookmarkButtonProps) {
  const { status } = useSession();
  const { openLogin } = useLoginModal();
  const { showToast } = useToast();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      openLogin();
      return;
    }
    if (loading) return;

    const prev = bookmarked;
    setBookmarked(!prev);
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${postId}/bookmark`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setBookmarked(prev);
        showToast(data.error ?? "스크랩 처리에 실패했습니다.", "error");
        return;
      }
      setBookmarked(Boolean(data.bookmarked));
      showToast(
        data.bookmarked ? "스크랩에 추가했습니다." : "스크랩을 해제했습니다."
      );
    } catch {
      setBookmarked(prev);
      showToast("요청 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors",
        bookmarked
          ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          : "text-muted-foreground hover:bg-card-hover"
      )}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "스크랩 해제" : "스크랩"}
    >
      <Bookmark
        className={cn("h-4 w-4", bookmarked && "fill-amber-500 text-amber-500")}
      />
      <span className="hidden sm:inline">{bookmarked ? "스크랩됨" : "스크랩"}</span>
    </button>
  );
}
