import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { SearchFilterBar } from "@/components/search/search-filter-bar";
import { SearchResultList } from "@/components/search/search-result-list";
import { SearchPopularSection } from "@/components/search/search-popular-section";
import { SEARCH_MIN_QUERY_LENGTH } from "@/lib/constants";
import { isDatabaseAvailable } from "@/lib/database-available";
import { searchPosts } from "@/lib/posts";
import { parseSearchFilters } from "@/lib/search/filter-options";
import { recordSearchQuery } from "@/lib/search/popular-searches";
import { enforceSearchRateLimitByIpAsync } from "@/lib/rate-limit";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    section?: string;
    period?: string;
    sort?: string;
  }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  return {
    title: query ? `"${query}" 검색 - 호케이` : "검색 - 호케이",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filters = parseSearchFilters(params);

  let rateLimited = false;
  if (query.length >= SEARCH_MIN_QUERY_LENGTH) {
    const h = await headers();
    const ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      "unknown";
    rateLimited = !(await enforceSearchRateLimitByIpAsync(ip));
  }

  const results =
    isDatabaseAvailable() &&
    query.length >= SEARCH_MIN_QUERY_LENGTH &&
    !rateLimited
      ? await searchPosts(query, 40, filters)
      : [];

  if (
    query.length >= SEARCH_MIN_QUERY_LENGTH &&
    !rateLimited &&
    isDatabaseAvailable()
  ) {
    void recordSearchQuery(query);
  }
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <header className="border-b border-border-light px-3 py-3">
          <h1 className="text-base font-bold text-foreground">검색</h1>
          {query ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              「{query}」 — {results.length}건
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-muted-foreground">
              검색어를 입력해 주세요.
            </p>
          )}
        </header>

        <Suspense fallback={null}>
          <SearchFilterBar query={query} />
        </Suspense>

        {!query ? (
          <>
            <SearchPopularSection />
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              상단 검색창에 키워드를 입력하세요.
            </p>
          </>
        ) : rateLimited ? (
          <p className="px-3 py-8 text-center text-sm text-red-600">
            검색 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : query.length < SEARCH_MIN_QUERY_LENGTH ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            검색어는 {SEARCH_MIN_QUERY_LENGTH}글자 이상 입력해 주세요.
          </p>
        ) : results.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            검색 결과가 없습니다.
          </p>
        ) : (
          <SearchResultList items={results} query={query} />
        )}

        <div className="border-t border-border-light px-3 py-3 text-center">
          <Link href="/" className="text-xs text-primary hover:underline">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
