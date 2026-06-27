import Link from "next/link";

/** 홈 뉴스 DB 조회 실패·빈 목록 시 안내 */
export function HomeNewsLoadAlert() {
  return (
    <div
      className="mx-2 mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 lg:mx-0"
      role="status"
    >
      뉴스를 불러오지 못했습니다. DB가 깨어나는 중일 수 있습니다.{" "}
      <Link href="/news" className="font-semibold text-primary underline">
        뉴스 전체 보기
      </Link>
      를 누르거나 페이지를 새로고침해 주세요.
    </div>
  );
}
