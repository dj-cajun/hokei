import { CategoryIcon } from "@/components/category/category-icon";
import { LifeInfoHubStrip } from "@/components/category/life-info-hub-box";
import Link from "next/link";
import { TextListItem } from "@/components/home/news-list-item";
import { Sidebar } from "@/components/layout/sidebar";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { PromoHubBannerBar } from "@/components/partner/promo-hub-banner-bar";
import type { PremiumPartnerNameItem } from "@/components/partner/premium-partner-name-grid";
import { LIFE_INFO_HUB_HREF } from "@/lib/life-info-hub";
import type { FeedItem } from "@/types/feed";

interface LifeInfoHubPageProps {
  posts: FeedItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  premiumStores?: PremiumPartnerNameItem[];
}

export function LifeInfoHubPage({
  posts,
  totalCount,
  currentPage,
  totalPages,
  premiumStores = [],
}: LifeInfoHubPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-1">
        <LifeInfoHubStrip>
          <div className="flex min-h-0 w-full min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-rose-100 bg-rose-50 text-rose-600">
              <CategoryIcon name="Flame" className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold leading-snug lg:text-lg">
                찐 생활정보
              </h1>
              <p className="truncate text-xs leading-snug text-muted-foreground">
                맛집 · 부동산 · 중고 · 취업 한눈에 · 전체{" "}
                {totalCount.toLocaleString()}건
              </p>
            </div>
          </div>
        </LifeInfoHubStrip>

        <PromoHubBannerBar premiumStores={premiumStores} />

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
          <p className="mt-4 border-t border-border-light px-2 py-3 text-center text-[11px]">
            <Link href="/partners" className="font-medium text-primary hover:underline">
              호케이 제휴 업소 보기 →
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
