"use client";

import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { useToast } from "@/components/providers/toast-provider";
import { AuthorNameWithPremiumCrown } from "@/components/user/author-name-with-premium-crown";
import { cn } from "@/lib/utils";

type CommentAuthorNameProps = {
  authorId?: string | null;
  authorName: string;
  postId: string;
  showPremiumCrown?: boolean;
};

export function CommentAuthorName({
  authorId,
  authorName,
  postId,
  showPremiumCrown = false,
}: CommentAuthorNameProps) {
  const { data: session, status } = useSession();
  const { openLogin } = useLoginModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSelf = session?.user?.id === authorId;
  const canMessage = Boolean(authorId && !isSelf);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function startConversation() {
    if (!authorId) return;
    if (status !== "authenticated") {
      openLogin();
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: authorId, postId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "쪽지를 시작하지 못했습니다.", "error");
        return;
      }
      setOpen(false);
      router.push(`/messages/${data.conversationId}`);
    } catch {
      showToast("요청 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  if (!canMessage) {
    return (
      <AuthorNameWithPremiumCrown
        name={authorName}
        showPremiumCrown={showPremiumCrown}
        className="text-xs font-semibold text-foreground"
      />
    );
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-foreground hover:text-primary hover:underline"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <AuthorNameWithPremiumCrown
          name={authorName}
          showPremiumCrown={showPremiumCrown}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 min-w-[9rem] rounded-md border border-border bg-surface py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            disabled={loading}
            onClick={() => void startConversation()}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-card-hover disabled:opacity-50"
            )}
          >
            <Mail className="h-3.5 w-3.5" />
            {loading ? "연결 중…" : "쪽지 보내기"}
          </button>
        </div>
      )}
    </div>
  );
}
