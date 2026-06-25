import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryIcon } from "@/components/category/category-icon";
import { TextListItem } from "@/components/home/news-list-item";
import { Sidebar } from "@/components/layout/sidebar";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { getWriteHref, isWritableSection } from "@/lib/write-sections";
import type { FeedItem } from "@/types/feed";
import type { ReactNode } from "react";

interface MiddleCategoryArchivePageProps {
  sectionSlug: string;
  sectionLabel: string;
  sectionHref: string;
  label: string;
  description: string | null;
  colorClass: string;
  icon: string;
  listHref: string;
  posts: FeedItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  subNav?: ReactNode;
}

export function MiddleCategoryArchivePage({
  sectionSlug,
  sectionLabel,
  sectionHref,
  label,
  description,
  colorClass,
  icon,
  listHref,
  posts,
  totalCount,
  currentPage,
  totalPages,
  subNav,
}: MiddleCategoryArchivePageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-1">
        <nav className="flex items-center gap-1 px-1 text-[11px] text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={sectionHref} className="hover:text-primary">
            {sectionLabel}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{label}</span>
        </nav>

        <div className="bg-surface px-2 py-2 lg:rounded-xl lg:p-5">
          <div className="flex items-start justify-between gap-2">
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
              <SectionWriteLink sectionSlug={sectionSlug} compact />
            )}
          </div>
          {subNav}
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
              actionHref={
                isWritableSection(sectionSlug)
                  ? getWriteHref(sectionSlug)
                  : undefined
              }
              actionLabel={
                isWritableSection(sectionSlug) ? "글쓰기" : undefined
              }
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
              basePath={listHref}
            />
          )}
        </section>
      </div>
    </div>
  );
}
