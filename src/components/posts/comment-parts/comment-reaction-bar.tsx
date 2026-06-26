"use client";

import { useEffect, useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type CommentReactionBarProps = {
  commentId: string;
  initialLikeCount: number;
  initialDislikeCount: number;
  disabled?: boolean;
};

export function CommentReactionBar({
  commentId,
  initialLikeCount,
  initialDislikeCount,
  disabled = false,
}: CommentReactionBarProps) {
  const { status } = useSession();
  const { openLogin } = useLoginModal();
  const { showToast } = useToast();
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [loading, setLoading] = useState<"like" | "dislike" | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || disabled) return;
    void fetch(`/api/comments/${commentId}/reaction`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setLiked(Boolean(data.likedByMe));
          setDisliked(Boolean(data.dislikedByMe));
          if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
          if (typeof data.dislikeCount === "number") {
            setDislikeCount(data.dislikeCount);
          }
        }
      })
      .catch(() => {});
  }, [commentId, status, disabled]);

  async function toggle(reaction: "like" | "dislike") {
    if (disabled) return;
    if (status !== "authenticated") {
      openLogin();
      return;
    }
    if (loading) return;

    const prev = { liked, disliked, likeCount, dislikeCount };
    const nextLiked = reaction === "like" ? !liked : false;
    const nextDisliked = reaction === "dislike" ? !disliked : false;

    let nextLikeCount = likeCount;
    let nextDislikeCount = dislikeCount;

    if (reaction === "like") {
      if (liked) nextLikeCount = Math.max(0, likeCount - 1);
      else {
        nextLikeCount = likeCount + 1;
        if (disliked) nextDislikeCount = Math.max(0, dislikeCount - 1);
      }
    } else if (disliked) {
      nextDislikeCount = Math.max(0, dislikeCount - 1);
    } else {
      nextDislikeCount = dislikeCount + 1;
      if (liked) nextLikeCount = Math.max(0, likeCount - 1);
    }

    setLiked(nextLiked);
    setDisliked(nextDisliked);
    setLikeCount(nextLikeCount);
    setDislikeCount(nextDislikeCount);
    setLoading(reaction);

    try {
      const res = await fetch(`/api/comments/${commentId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLiked(prev.liked);
        setDisliked(prev.disliked);
        setLikeCount(prev.likeCount);
        setDislikeCount(prev.dislikeCount);
        showToast(data.error ?? "반응 처리에 실패했습니다.", "error");
        return;
      }
      setLiked(Boolean(data.likedByMe));
      setDisliked(Boolean(data.dislikedByMe));
      setLikeCount(data.likeCount ?? prev.likeCount);
      setDislikeCount(data.dislikeCount ?? prev.dislikeCount);
    } catch {
      setLiked(prev.liked);
      setDisliked(prev.disliked);
      setLikeCount(prev.likeCount);
      setDislikeCount(prev.dislikeCount);
      showToast("요청 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-1.5 flex items-center gap-1">
      <button
        type="button"
        onClick={() => void toggle("like")}
        disabled={loading === "like"}
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          liked
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:bg-card-hover"
        )}
        aria-pressed={liked}
        aria-label={liked ? "좋아요 취소" : "좋아요"}
      >
        <ThumbsUp className={cn("h-3 w-3", liked && "fill-current")} />
        <span>{likeCount}</span>
      </button>
      <button
        type="button"
        onClick={() => void toggle("dislike")}
        disabled={loading === "dislike"}
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
          disliked
            ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            : "text-muted-foreground hover:bg-card-hover"
        )}
        aria-pressed={disliked}
        aria-label={disliked ? "싫어요 취소" : "싫어요"}
      >
        <ThumbsDown className={cn("h-3 w-3", disliked && "fill-current")} />
        <span>{dislikeCount}</span>
      </button>
    </div>
  );
}
