import Link from "next/link";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string>;
};

function pageHref(
  basePath: string,
  page: number,
  query?: Record<string, string>
) {
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  query,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      (p >= currentPage - 1 && p <= currentPage + 1)
  );

  return (
    <nav
      className="flex items-center justify-center gap-1 border-t border-gray-100 px-3 py-4"
      aria-label="페이지 목록"
    >
      {currentPage > 1 && (
        <Link
          href={pageHref(basePath, currentPage - 1, query)}
          className="rounded-sm px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          이전
        </Link>
      )}
      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const showEllipsis = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {showEllipsis && (
              <span className="px-1 text-xs text-gray-400">…</span>
            )}
            <Link
              href={pageHref(basePath, p, query)}
              aria-current={p === currentPage ? "page" : undefined}
              className={cn(
                "min-w-[28px] rounded-sm px-2 py-1 text-center text-xs",
                p === currentPage
                  ? "bg-[#0f172a] font-semibold text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {currentPage < totalPages && (
        <Link
          href={pageHref(basePath, currentPage + 1, query)}
          className="rounded-sm px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
        >
          다음
        </Link>
      )}
    </nav>
  );
}
