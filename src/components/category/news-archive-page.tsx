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
  dateGroups: NewsDateGroup[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function NewsArchivePage({
  label,
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
          <p className="mt-1 text-[11px] text-gray-400">
            전체 {totalCount.toLocaleString()}건
          </p>
        </div>

        <section className="bg-white lg:rounded-xl">
          <header className="border-b border-[#f3f4f6] px-2 py-2">
            <h2 className="border-l-4 border-l-primary pl-2 text-sm font-bold text-primary">
              전체 뉴스
            </h2>
          </header>

          {flatCount === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-gray-400">
              아직 수집된 뉴스가 없습니다. 매일 오전 7시(호치민)에 자동으로
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
