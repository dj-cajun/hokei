"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type HeaderSearchProps = {
  variant?: "mobile" | "desktop";
};

function SearchInput({
  initialQ,
  variant,
  onSearch,
}: {
  initialQ: string;
  variant: "mobile" | "desktop";
  onSearch: (query: string) => void;
}) {
  const [q, setQ] = useState(initialQ);
  const isMobile = variant === "mobile";

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    onSearch(trimmed);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "relative min-w-0",
        isMobile ? "flex-1 lg:hidden" : "mx-auto hidden max-w-md flex-1 lg:block"
      )}
      role="search"
    >
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400",
          isMobile ? "left-2.5 h-3.5 w-3.5" : "left-3 h-4 w-4"
        )}
      />
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={isMobile ? "검색" : "뉴스, 숙소, 구인 검색..."}
        aria-label="검색"
        className={cn(
          "w-full rounded-full border border-gray-200 bg-gray-50 text-gray-800 outline-none placeholder:text-gray-400 focus:border-gray-300",
          isMobile ? "h-8 pl-8 pr-3 text-xs" : "h-9 pl-9 pr-3 text-sm"
        )}
      />
    </form>
  );
}

export function HeaderSearch({ variant = "mobile" }: HeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSearchPage = pathname === "/search";
  const urlQ = isSearchPage ? (searchParams.get("q") ?? "") : "";
  const inputKey = isSearchPage ? `search-${urlQ}` : "search-home";

  return (
    <SearchInput
      key={inputKey}
      initialQ={urlQ}
      variant={variant}
      onSearch={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)}
    />
  );
}
