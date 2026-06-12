import { Suspense } from "react";
import { CategoryIcon } from "@/components/category/category-icon";
import { TextListItem } from "@/components/home/news-list-item";
import { Sidebar } from "@/components/layout/sidebar";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { Pagination } from "@/components/ui/pagination";
import { SectionInfiniteList } from "@/components/category/section-infinite-list";
import { RegionFilterBar } from "@/components/region/region-filter-bar";
import { LIST_PAGE_SIZE } from "@/lib/constants";
import { isWritableSection } from "@/lib/write-sections";
import type { FeedItem } from "@/types/feed";

interface SectionArchivePageProps {
  sectionSlug: string;
  label: string;
  description: string | null;
  colorClass: string;
  icon: string;
  basePath: string;
  posts: FeedItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  region?: string;
}

export function SectionArchivePage({
  sectionSlug,
  label,
  description,
  colorClass,
  icon,
  basePath,
  posts,
  totalCount,
  currentPage,
  totalPages,
  region,
}: SectionArchivePageProps) {
  const paginationQuery = region ? { region } : undefined;
  const showRegionFilter = isWritableSection(sectionSlug);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2 bg-surface px-2 py-2 lg:rounded-xl lg:p-5">
          <div className="flex min-w-0 items-start gap-2">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${colorClass}`}
            >
              <CategoryIcon name={icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-snug lg:text-lg">
                {label}
              </h1>
              {description && (
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {description}
                </p>
              )}
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                전체 {totalCount.toLocaleString()}건
              </p>
            </div>
          </div>
          {isWritableSection(sectionSlug) && (
            <SectionWriteLink sectionSlug={sectionSlug} />
          )}
        </div>

        <section className="bg-surface lg:rounded-xl">
          <header className="flex items-center justify-between border-b border-[#f3f4f6] px-2 py-1.5">
            <h2 className="border-l-4 border-l-primary pl-2 text-sm font-bold text-primary">
              전체 글
            </h2>
          </header>
          {showRegionFilter && (
            <Suspense fallback={null}>
              <RegionFilterBar basePath={basePath} />
            </Suspense>
          )}
          {sectionSlug === "community" && currentPage === 1 ? (
            <SectionInfiniteList
              sectionSlug={sectionSlug}
              initialItems={posts}
              initialCursor={
                posts.length >= LIST_PAGE_SIZE && posts.length < totalCount
                  ? (posts.at(-1)?.id ?? null)
                  : null
              }
              communityOnly
              region={region}
            />
          ) : posts.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              등록된 글이 없습니다. 첫 글을 작성해 보세요.
            </p>
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
              basePath={basePath}
              query={paginationQuery}
              className={
                sectionSlug === "community" && currentPage === 1
                  ? "hidden lg:flex"
                  : undefined
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
