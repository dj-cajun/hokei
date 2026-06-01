import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryIcon } from "@/components/category/category-icon";
import { TextListItem } from "@/components/home/news-list-item";
import { Sidebar } from "@/components/layout/sidebar";
import { SectionWriteLink } from "@/components/layout/section-write-link";
import { Pagination } from "@/components/ui/pagination";
import { isWritableSection } from "@/lib/write-sections";
import type { FeedItem } from "@/types/feed";

interface SubcategoryPageProps {
  sectionSlug: string;
  sectionLabel: string;
  sectionHref: string;
  listHref: string;
  label: string;
  description: string | null;
  colorClass: string;
  icon: string;
  posts: FeedItem[];
  currentPage: number;
  totalPages: number;
  isNewsSection: boolean;
}

export function SubcategoryPage({
  sectionSlug,
  sectionLabel,
  sectionHref,
  listHref,
  label,
  description,
  colorClass,
  icon,
  posts,
  currentPage,
  totalPages,
  isNewsSection,
}: SubcategoryPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-1">
        <nav className="flex items-center gap-1 px-1 text-[11px] text-gray-400">
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

        <div className="bg-white px-2 py-2 lg:rounded-xl lg:p-5">
          <div className="flex items-start gap-2">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${colorClass}`}
            >
              <CategoryIcon name={icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span
                className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}
              >
                {sectionLabel}
              </span>
              <h1 className="mt-0.5 text-base font-bold leading-snug lg:text-lg">
                {label}
              </h1>
              {description && (
                <p className="mt-1 text-xs leading-snug text-gray-400">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="bg-white">
          <header className="flex items-center justify-between border-b border-[#f3f4f6] px-2 py-1.5">
            <h2 className="border-l-4 border-l-primary pl-2 text-sm font-bold text-primary">
              최신 글
            </h2>
            {isWritableSection(sectionSlug) && (
              <SectionWriteLink sectionSlug={sectionSlug} compact />
            )}
          </header>
          {posts.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-gray-400">
              {isNewsSection
                ? "아직 글이 없습니다. 뉴스는 매일 오전 9시(호치민)에 자동 등록됩니다."
                : "등록된 글이 없습니다. 첫 글을 작성해 보세요."}
            </p>
          ) : (
            <div>
              {posts.map((post) => (
                <TextListItem key={post.id} item={post} />
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={listHref}
          />
        </section>
      </main>
    </div>
  );
}
