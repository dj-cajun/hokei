import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse-shimmer rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export function FeedSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-surface">
      <div className="flex border-b border-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="mx-2 my-2 h-8 flex-1 rounded-lg" />
        ))}
      </div>
      <div className="divide-y divide-border-light">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3">
            <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2.5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[480px] space-y-4 p-4 lg:max-w-6xl">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-4/5" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-surface">
      <Skeleton className="h-12 w-full rounded-none border-b border-border" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-16 w-full rounded-none border-b border-border-light"
        />
      ))}
    </div>
  );
}
