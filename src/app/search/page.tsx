import Link from "next/link";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { NewsListItem, TextListItem } from "@/components/home/news-list-item";
import { SEARCH_MIN_QUERY_LENGTH } from "@/lib/constants";
import { searchPosts } from "@/lib/posts";
import { enforceSearchRateLimitByIpAsync } from "@/lib/rate-limit";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  return {
    title: query ? `"${query}" 검색 - 호케이` : "검색 - 호케이",
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

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
    query.length >= SEARCH_MIN_QUERY_LENGTH && !rateLimited
      ? await searchPosts(query)
      : [];

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <main className="min-w-0 flex-1 bg-white lg:rounded-lg">
        <header className="border-b border-gray-100 px-3 py-3">
          <h1 className="text-base font-bold text-gray-900">검색</h1>
          {query ? (
            <p className="mt-0.5 text-xs text-gray-500">
              「{query}」 — {results.length}건
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-gray-500">
              검색어를 입력해 주세요.
            </p>
          )}
        </header>

        {!query ? (
          <p className="px-3 py-8 text-center text-sm text-gray-400">
            상단 검색창에 키워드를 입력하세요.
          </p>
        ) : rateLimited ? (
          <p className="px-3 py-8 text-center text-sm text-red-600">
            검색 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.
          </p>
        ) : query.length < SEARCH_MIN_QUERY_LENGTH ? (
          <p className="px-3 py-8 text-center text-sm text-gray-400">
            검색어는 {SEARCH_MIN_QUERY_LENGTH}글자 이상 입력해 주세요.
          </p>
        ) : results.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-gray-400">
            검색 결과가 없습니다.
          </p>
        ) : (
          <div>
            {results.map((item) =>
              item.thumbnail ? (
                <NewsListItem key={item.id} item={item} />
              ) : (
                <TextListItem key={item.id} item={item} />
              )
            )}
          </div>
        )}

        <div className="border-t border-gray-50 px-3 py-3 text-center">
          <Link href="/" className="text-xs text-primary hover:underline">
            홈으로
          </Link>
        </div>
      </main>
    </div>
  );
}
