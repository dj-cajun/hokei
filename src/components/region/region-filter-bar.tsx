"use client";

import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HOCHIMINH_REGIONS } from "@/lib/regions";
import { cn } from "@/lib/utils";

type RegionFilterBarProps = {
  basePath: string;
};

export function RegionFilterBar({ basePath }: RegionFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("region") ?? "";

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) params.delete("region");
    else params.set("region", slug);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <div className="border-b border-border-light px-2 py-2">
      <p className="mb-1.5 px-1 text-[10px] font-semibold text-muted-foreground">
        지역
      </p>
      <div className="flex flex-wrap gap-1">
        <FilterChip active={!active} onClick={() => select("")}>
          전체
        </FilterChip>
        {HOCHIMINH_REGIONS.map((r) => (
          <FilterChip
            key={r.slug}
            active={active === r.slug}
            onClick={() => select(r.slug)}
          >
            {r.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] transition-colors",
        active
          ? "bg-primary font-semibold text-white"
          : "bg-secondary/80 text-muted-foreground hover:bg-card-hover"
      )}
    >
      {children}
    </button>
  );
}
