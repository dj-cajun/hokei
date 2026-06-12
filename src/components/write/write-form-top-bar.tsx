"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

type WriteFormTopBarProps = {
  title?: string;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: () => void;
};

export function WriteFormTopBar({
  title = "글쓰기",
  submitLabel = "등록",
  submitting = false,
  onSubmit,
}: WriteFormTopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <div className="flex h-11 items-center justify-between px-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center text-gray-700 focus-ring"
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-gray-800">
          {title}
        </h1>

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-sm bg-[#0f172a] px-3 py-1.5 text-xs font-semibold text-white focus-ring disabled:opacity-50"
        >
          {submitting ? "등록 중…" : submitLabel}
        </button>
      </div>
    </header>
  );
}
