"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

function vnDisplayClass(text: string) {
  return text.length > 72
    ? "mt-4 max-w-lg text-xl font-bold leading-snug sm:text-2xl"
    : "mt-4 text-4xl font-bold leading-tight";
}

type LifeShowModeToggleProps = {
  children: React.ReactNode;
  vnText?: string | null;
  title: string;
};

export function LifeShowModeToggle({
  children,
  vnText,
  title,
}: LifeShowModeToggleProps) {
  const [showMode, setShowMode] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowMode((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:bg-card-hover"
      >
        <Smartphone className="h-3.5 w-3.5" />
        {showMode ? "일반 보기" : "화면 보여주기"}
      </button>

      {showMode && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white p-6 text-center dark:bg-zinc-950"
          role="dialog"
          aria-modal="true"
          aria-label="점원에게 보여주기 모드"
        >
          <p className="text-lg text-muted-foreground">{title}</p>
          {vnText && (
            <p className={cn(vnDisplayClass(vnText), "text-foreground")}>
              {vnText}
            </p>
          )}
          <button
            type="button"
            onClick={() => setShowMode(false)}
            className="mt-10 rounded-full bg-primary px-6 py-3 text-base font-semibold text-white"
          >
            닫기
          </button>
        </div>
      )}

      <div className={cn(showMode && "sr-only")}>{children}</div>
    </>
  );
}
