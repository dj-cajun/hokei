"use client";

import { useEffect, useState } from "react";
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
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    void fetch(`/api/posts/${postId}/like`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setLiked(Boolean(data.likedByMe));
          if (typeof data.likeCount === "number") setCount(data.likeCount);
        }
      })
      .catch(() => {});
  }, [postId, status]);

  async function toggle() {
    if (status !== "authenticated") {
      openLogin();
      return;
    }
    if (loading) return;

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount(nextLiked ? count + 1 : Math.max(0, count - 1));
    setBounce(true);
    window.setTimeout(() => setBounce(false), 400);

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setLiked(prevLiked);
        setCount(prevCount);
        showToast(data.error ?? "좋아요 처리에 실패했습니다.", "error");
        return;
      }
      setLiked(Boolean(data.liked));
      setCount(data.likeCount ?? prevCount);
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
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
          ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          : "text-muted-foreground hover:bg-card-hover"
      )}
      aria-pressed={liked}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <Heart
        className={cn(
          "h-4 w-4 fill-none",
          liked && "text-rose-500",
          bounce && "animate-heart-bounce"
        )}
      />
      <span>{count}</span>
    </button>
  );
}
