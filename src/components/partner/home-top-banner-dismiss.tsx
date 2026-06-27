"use client";

import { X } from "lucide-react";
import { useHomeTopBannerDismiss } from "@/components/partner/home-top-banner-visibility";
import { cn } from "@/lib/utils";

export function HomeTopBannerDismiss() {
  const dismiss = useHomeTopBannerDismiss();

  return (
    <>
      <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-1.5 lg:p-2">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dismiss();
          }}
          className={cn(
            "pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full",
            "bg-black/45 text-white shadow-sm backdrop-blur-sm",
            "transition-colors hover:bg-black/60"
          )}
          aria-label="상단 배너 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dismiss();
        }}
        className={cn(
          "absolute bottom-1 right-2 z-10 text-[10px] font-medium text-white/90",
          "underline-offset-2 hover:underline lg:bottom-1.5 lg:right-3 lg:text-[11px]"
        )}
        style={{ textShadow: "0 1px 2px rgba(0,0,0,.55)" }}
      >
        1일 동안 보지 않음
      </button>
    </>
  );
}
