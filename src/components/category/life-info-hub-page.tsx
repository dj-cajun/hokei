import { CategoryIcon } from "@/components/category/category-icon";
import { TextListItem } from "@/components/home/news-list-item";
import { Sidebar } from "@/components/layout/sidebar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { LIFE_INFO_HUB_HREF } from "@/lib/life-info-hub";
import type { FeedItem } from "@/types/feed";
import Link from "next/link";

interface LifeInfoHubPageProps {
  posts: FeedItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function LifeInfoHubPage({
  posts,
  totalCount,
  currentPage,
  totalPages,
}: LifeInfoHubPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="bg-surface px-2 py-2 lg:rounded-xl lg:p-5">
          <div className="flex min-w-0 items-start gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-rose-50 text-rose-600">
              <CategoryIcon name="Flame" className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-snug lg:text-lg">
                찐 생활정보
              </h1>
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                맛집 · 부동산 · 중고 · 취업 한눈에
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                전체 {totalCount.toLocaleString()}건
              </p>
            </div>
          </div>
        </div>

        <section className="bg-surface lg:rounded-xl">
          <header className="flex items-center justify-between border-b border-[#f3f4f6] px-2 py-1.5">
            <h2 className="border-l-4 border-l-primary pl-2 text-sm font-bold text-primary">
              전체 글
            </h2>
          </header>
          {posts.length === 0 ? (
            <EmptyState
              title="아직 글이 없습니다"
              description="이 게시판의 첫 글을 작성해 보세요."
            />
          ) : (
            <div>
              {posts.map((post) => (
                <TextListItem key={post.id} item={post} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath={LIFE_INFO_HUB_HREF}
            />
          )}
        </section>

        <footer className="bg-surface px-3 py-4 text-center lg:rounded-xl">
          <Link
            href="/partners"
            className="text-xs text-primary hover:underline"
          >
            제휴 업소 보기 → /partners
          </Link>
        </footer>
      </div>
    </div>
  );
}
