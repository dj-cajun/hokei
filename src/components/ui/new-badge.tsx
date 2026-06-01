import { cn } from "@/lib/utils";

export function NewBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "mr-1 inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-sm bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white",
        className
      )}
      aria-label="새 글"
    >
      N
    </span>
  );
}
