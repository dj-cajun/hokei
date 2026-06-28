"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { parseApiError } from "@/lib/api-response";
import { cn } from "@/lib/utils";

type AdminLifeGuideDeleteButtonProps = {
  guideId: string;
  title: string;
  redirectHref?: string;
  compact?: boolean;
  className?: string;
};

export function AdminLifeGuideDeleteButton({
  guideId,
  title,
  redirectHref,
  compact = false,
  className,
}: AdminLifeGuideDeleteButtonProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: session } = useSession();
  const [deleting, setDeleting] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  if (!isAdmin) return null;

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (
      !confirm(
        `「${title.slice(0, 40)}」을(를) 삭제할까요?\n복구할 수 없습니다.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/life/${guideId}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        showToast(parseApiError(data) ?? "삭제 실패", "error");
        return;
      }
      showToast("삭제했습니다.");
      if (redirectHref) {
        router.push(redirectHref);
      }
      router.refresh();
    } catch {
      showToast("삭제 실패", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={(event) => void handleDelete(event)}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50",
        compact ? "px-2 py-1 text-[10px] font-medium" : "px-2.5 py-1.5 text-xs font-medium",
        className
      )}
      aria-label={`${title} 삭제`}
    >
      {deleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      {!compact && "삭제"}
    </button>
  );
}
