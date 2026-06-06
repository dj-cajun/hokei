"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLoginModal } from "@/components/auth/login-modal-context";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type SendMessageButtonProps = {
  recipientId: string;
  recipientName: string;
  postId?: string;
  className?: string;
};

export function SendMessageButton({
  recipientId,
  recipientName,
  postId,
  className,
}: SendMessageButtonProps) {
  const { data: session, status } = useSession();
  const { openLogin } = useLoginModal();
  const { showToast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startConversation() {
    if (status !== "authenticated") {
      openLogin();
      return;
    }
    if (session?.user?.id === recipientId) return;
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, postId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "쪽지를 시작하지 못했습니다.", "error");
        return;
      }
      router.push(`/messages/${data.conversationId}`);
    } catch {
      showToast("요청 처리 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void startConversation()}
      disabled={loading || session?.user?.id === recipientId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50",
        className
      )}
    >
      <Mail className="h-3.5 w-3.5" />
      {loading ? "연결 중…" : `${recipientName}님에게 쪽지`}
    </button>
  );
}
