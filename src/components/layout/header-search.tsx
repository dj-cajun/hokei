"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  clearRecentSearches,
  getRecentSearches,
  saveRecentSearch,
} from "@/lib/search/recent-searches";

type HeaderSearchProps = {
  variant?: "mobile" | "desktop";
};

type SuggestItem = { id: string; title: string; category: string };

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
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestItem[]>([]);
  const [recent, setRecent] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : getRecentSearches()
  );
  const [popular, setPopular] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isMobile = variant === "mobile";

  useEffect(() => {
    if (!open) return;
    void fetch("/api/search/popular")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.items)) {
          setPopular(data.items.map((i: { query: string }) => i.query));
        }
      })
      .catch(() => setPopular([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;

    const timer = window.setTimeout(() => {
      void fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setSuggestions(data.items ?? []);
        })
        .catch(() => setSuggestions([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [q]);

  function submit(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setOpen(false);
    onSearch(trimmed);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(q);
  }

  const showPanel =
    open &&
    (suggestions.length > 0 ||
      (q.trim().length < 2 && (recent.length > 0 || popular.length > 0)));

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative min-w-0",
        isMobile ? "flex-1 lg:hidden" : "mx-auto hidden max-w-md flex-1 lg:block"
      )}
    >
      <form onSubmit={onSubmit} role="search">
        <Search
          className={cn(
            "pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-muted-foreground",
            isMobile ? "left-2.5 h-3.5 w-3.5" : "left-3 h-4 w-4"
          )}
        />
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            if (v.trim().length < 2) setSuggestions([]);
          }}
          onFocus={() => {
            setOpen(true);
            setRecent(getRecentSearches());
          }}
          placeholder={isMobile ? "검색" : "뉴스, 숙소, 구인 검색..."}
          aria-label="검색"
          autoComplete="off"
          className={cn(
            "w-full rounded-full border border-border bg-muted text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/40",
            isMobile ? "h-8 pl-8 pr-3 text-xs" : "h-9 pl-9 pr-3 text-sm"
          )}
        />
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {q.trim().length < 2 && recent.length > 0 && (
            <div className="border-b border-border-light p-2">
              <div className="mb-1 flex items-center justify-between px-2">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  최근 검색
                </span>
                <button
                  type="button"
                  className="text-[10px] text-primary hover:underline"
                  onClick={() => {
                    clearRecentSearches();
                    setRecent([]);
                  }}
                >
                  전체 삭제
                </button>
              </div>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-xs hover:bg-card-hover"
                  onClick={() => submit(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          )}
          {q.trim().length < 2 && popular.length > 0 && (
            <div className="border-b border-border-light p-2">
              <span className="mb-1 block px-2 text-[10px] font-semibold text-muted-foreground">
                인기 검색
              </span>
              <div className="flex flex-wrap gap-1 px-1">
                {popular.slice(0, 8).map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="rounded-full bg-secondary/80 px-2 py-1 text-[10px] hover:bg-card-hover"
                    onClick={() => submit(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
          <ul>
            {suggestions.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/posts/${item.id}`}
                  className="block px-3 py-2 hover:bg-card-hover"
                  onClick={() => {
                    saveRecentSearch(q.trim());
                    setOpen(false);
                  }}
                >
                  <p className="line-clamp-1 text-xs font-medium">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.category}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
      onSearch={(query) => {
        saveRecentSearch(query);
        router.push(`/search?q=${encodeURIComponent(query)}`);
      }}
    />
  );
}
