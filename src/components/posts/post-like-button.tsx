"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type PostLikeButtonProps = {
  postId: string;
  initialCount: number;
  initialLiked?: boolean;
};

export function PostLikeButton({
  postId,
  initialCount,
  initialLiked = false,
}: PostLikeButtonProps) {
  const { status } = useSession();
  const { openLogin } = useLoginModal();
  const { showToast } = useToast();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      openLogin();
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "좋아요 처리에 실패했습니다.", "error");
        return;
      }
      setLiked(Boolean(data.liked));
      setCount(data.likeCount ?? count);
    } catch {
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
        liked
          ? "text-rose-600 hover:bg-rose-50"
          : "text-gray-500 hover:bg-gray-50"
      )}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <Heart
        className={cn("h-4 w-4", liked && "fill-rose-500 text-rose-500")}
      />
      <span>{count}</span>
    </button>
  );
}
