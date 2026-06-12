"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  { id: "all", label: "전체" },
  { id: "news", label: "뉴스" },
  { id: "community", label: "커뮤니티" },
  { id: "real-estate", label: "부동산" },
  { id: "jobs", label: "구인" },
] as const;

const periods = [
  { id: "all", label: "전체 기간" },
  { id: "today", label: "오늘" },
  { id: "week", label: "1주" },
  { id: "month", label: "1개월" },
] as const;

const sorts = [
  { id: "relevance", label: "관련도" },
  { id: "recent", label: "최신" },
] as const;

export function SearchFilterBar({ query }: { query: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const section = searchParams.get("section") ?? "all";
  const period = searchParams.get("period") ?? "all";
  const sort = searchParams.get("sort") ?? "relevance";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || (key === "sort" && value === "relevance")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (query) params.set("q", query);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  }

  if (!query) return null;

  return (
    <div className="space-y-2 border-b border-border-light px-3 py-2">
      <div className="flex flex-wrap gap-1">
        {sections.map((s) => (
          <FilterChip
            key={s.id}
            active={section === s.id}
            onClick={() => update("section", s.id)}
          >
            {s.label}
          </FilterChip>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {periods.map((p) => (
          <FilterChip
            key={p.id}
            active={period === p.id}
            onClick={() => update("period", p.id)}
          >
            {p.label}
          </FilterChip>
        ))}
        {sorts.map((s) => (
          <FilterChip
            key={s.id}
            active={sort === s.id}
            onClick={() => update("sort", s.id)}
          >
            {s.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "bg-muted text-muted-foreground hover:bg-card-hover"
      )}
    >
      {children}
    </button>
  );
}
