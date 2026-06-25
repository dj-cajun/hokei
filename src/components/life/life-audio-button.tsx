"use client";

import { useRef } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LifeAudioButtonProps = {
  audioUrl: string | null | undefined;
  className?: string;
};

export function LifeAudioButton({ audioUrl, className }: LifeAudioButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  if (!audioUrl?.trim()) return null;

  function play() {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl!);
    }
    void audioRef.current.play();
  }

  return (
    <button
      type="button"
      onClick={play}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-100",
        className
      )}
      aria-label="발음 듣기"
    >
      <Volume2 className="h-3.5 w-3.5" />
      발음 듣기
    </button>
  );
}
