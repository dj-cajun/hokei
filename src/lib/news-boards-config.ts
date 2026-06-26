/** @deprecated 보드 URL → DB 하위 카테고리 리다이렉트 (네비 통일) */

export type NewsBoardSlug = "news-local" | "news-world" | "news-community";

/** 구 `/board/news-*` → `/news/*` 하위 카테고리 */
export const NEWS_BOARD_REDIRECTS: Record<NewsBoardSlug, string> = {
  "news-local": "/news/visa-residency",
  "news-world": "/news",
  "news-community": "/news/consulate-association",
};

export function getNewsBoardRedirect(slug: string): string | undefined {
  if (slug in NEWS_BOARD_REDIRECTS) {
    return NEWS_BOARD_REDIRECTS[slug as NewsBoardSlug];
  }
  return undefined;
}

export function isNewsSectionPath(pathname: string): boolean {
  return (
    pathname === "/news" ||
    pathname.startsWith("/news/") ||
    pathname.startsWith("/board/news")
  );
}
