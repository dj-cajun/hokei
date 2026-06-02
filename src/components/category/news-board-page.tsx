import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NewsListItem } from "@/components/home/news-list-item";
import { Sidebar } from "@/components/layout/sidebar";
import { Pagination } from "@/components/ui/pagination";
import type { NewsDateGroup } from "@/lib/news-archive";

function formatDayHeading(dateLabel: string): string {
  const [y, m, d] = dateLabel.split("-").map(Number);
  if (!y || !m || !d) return dateLabel;
  return `${y}년 ${m}월 ${d}일`;
}

interface NewsBoardPageProps {
  title: string;
  description: string;
  boardHref: string;
  dateGroups: NewsDateGroup[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function NewsBoardPage({
  title,
  description,
  boardHref,
  dateGroups,
  totalCount,
  currentPage,
  totalPages,
}: NewsBoardPageProps) {
  const flatCount = dateGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-1">
        <nav className="flex items-center gap-1 px-1 text-[11px] text-gray-400">
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/news" className="hover:text-primary">
            뉴스
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{title}</span>
        </nav>

        <div className="bg-white px-2 py-2 lg:rounded-xl lg:p-5">
          <h1 className="text-base font-bold leading-snug lg:text-lg">{title}</h1>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {totalCount.toLocaleString()}건 · 최신순
          </p>
        </div>

        <section className="bg-white lg:rounded-xl">
          {flatCount === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-gray-400">
              이 게시판에 표시할 뉴스가 없습니다.
            </p>
          ) : (
            dateGroups.map((group) => (
              <div key={group.dateLabel}>
                <h2 className="sticky top-11 z-10 border-b border-[#f3f4f6] bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 lg:top-14">
                  {formatDayHeading(group.dateLabel)}
                </h2>
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
              basePath={boardHref}
            />
          )}
        </section>
      </main>
    </div>
  );
}
