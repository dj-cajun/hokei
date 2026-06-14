import { NewsListItem } from "@/components/home/news-list-item";
import { NewsInfiniteList } from "@/components/category/news-infinite-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Sidebar } from "@/components/layout/sidebar";
import { Pagination } from "@/components/ui/pagination";
import type { NewsDateGroup } from "@/lib/news/group-news-by-date";
import type { FeedItem } from "@/types/feed";

function formatDayHeading(dateLabel: string): string {
  const [y, m, d] = dateLabel.split("-").map(Number);
  if (!y || !m || !d) return dateLabel;
  return `${y}년 ${m}월 ${d}일`;
}

interface NewsArchivePageProps {
  label: string;
  dateGroups: NewsDateGroup[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  initialCursor?: string | null;
  flatItems?: FeedItem[];
  loadError?: string | null;
}

export function NewsArchivePage({
  label,
  dateGroups,
  totalCount,
  currentPage,
  totalPages,
  initialCursor = null,
  flatItems = [],
  loadError = null,
}: NewsArchivePageProps) {
  const flatCount = dateGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-1 px-2 py-2 lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="bg-surface px-2 py-2 lg:rounded-xl lg:p-5">
          <h1 className="text-base font-bold leading-snug lg:text-lg">{label}</h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            전체 {totalCount.toLocaleString()}건
          </p>
        </div>

        <section className="bg-surface lg:rounded-xl">
          <header className="border-b border-[#f3f4f6] px-2 py-2">
            <h2 className="border-l-4 border-l-primary pl-2 text-sm font-bold text-primary">
              전체 뉴스
            </h2>
          </header>

          {loadError ? (
            <EmptyState
              title="뉴스를 불러오지 못했습니다"
              description={`DB 연결을 확인하세요. Neon 첫 조회는 10초 이상 걸릴 수 있습니다. (${loadError})`}
            />
          ) : flatCount === 0 ? (
            <EmptyState
              title="아직 뉴스가 없습니다"
              description="호치민·베트남 관련 소식이 올라오면 여기에 표시됩니다."
            />
          ) : currentPage === 1 ? (
            <NewsInfiniteList
              initialItems={flatItems.length > 0 ? flatItems : dateGroups.flatMap((g) => g.items)}
              initialCursor={initialCursor}
            />
          ) : (
            dateGroups.map((group) => (
              <div key={group.dateLabel}>
                <h3 className="sticky top-11 z-10 border-b border-[#f3f4f6] bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground lg:top-14">
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
              className={currentPage === 1 ? "hidden lg:flex" : undefined}
            />
          )}
        </section>
      </div>
    </div>
  );
}
