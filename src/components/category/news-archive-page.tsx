import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryIcon } from "@/components/category/category-icon";
import { NewsListItem } from "@/components/home/news-list-item";
import { Sidebar } from "@/components/layout/sidebar";
import { Pagination } from "@/components/ui/pagination";
import type { NewsDateGroup } from "@/lib/news-archive";

function formatDayHeading(dateLabel: string): string {
  const [y, m, d] = dateLabel.split("-").map(Number);
  if (!y || !m || !d) return dateLabel;
  return `${y}년 ${m}월 ${d}일`;
}

interface NewsArchivePageProps {
  label: string;
  colorClass: string;
  subcategories: {
    id: string;
    label: string;
    description: string | null;
    href: string;
    icon: string;
  }[];
  dateGroups: NewsDateGroup[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function NewsArchivePage({
  label,
  colorClass,
  subcategories,
  dateGroups,
  totalCount,
  currentPage,
  totalPages,
}: NewsArchivePageProps) {
  const flatCount = dateGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="bg-white px-2 py-2 lg:rounded-xl lg:p-5">
          <h1 className="text-base font-bold leading-snug lg:text-lg">{label}</h1>
          <p className="mt-1 text-xs text-gray-400">
            자동 수집 뉴스를 날짜별로 보관합니다. 하루 최대 10건 추가·기존 글은
            삭제하지 않습니다.
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            전체 {totalCount.toLocaleString()}건
          </p>
        </div>

        <section className="divide-y divide-[#f3f4f6] bg-white lg:rounded-xl">
          <header className="px-2 py-2 text-[11px] font-semibold text-gray-500">
            주제별 보기
          </header>
          {subcategories.map((child) => (
            <Link
              key={child.id}
              href={child.href}
              className="flex items-center justify-between gap-2 px-2 py-2 active:bg-secondary/80"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm ${colorClass}`}
                >
                  <CategoryIcon name={child.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-sm font-medium">{child.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
            </Link>
          ))}
        </section>

        <section className="bg-white lg:rounded-xl">
          <header className="border-b border-[#f3f4f6] px-2 py-2">
            <h2 className="border-l-4 border-l-primary pl-2 text-sm font-bold text-primary">
              전체 뉴스
            </h2>
          </header>

          {flatCount === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-gray-400">
              아직 수집된 뉴스가 없습니다. 매일 오전 9시(호치민)에 자동으로
              추가됩니다.
            </p>
          ) : (
            dateGroups.map((group) => (
              <div key={group.dateLabel}>
                <h3 className="sticky top-11 z-10 border-b border-[#f3f4f6] bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 lg:top-14">
                  {formatDayHeading(group.dateLabel)}
                </h3>
                <div>
                  {group.items.map((item) => (
                    <NewsListItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              basePath="/news"
            />
          )}
        </section>
      </div>
    </div>
  );
}
