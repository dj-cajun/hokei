/** 클라이언트·서버 공용 — DB/Prisma import 금지 */

export type NewsBoardSlug = "news-local" | "news-world" | "news-community";

export type NewsBoardConfig = {
  slug: NewsBoardSlug;
  href: `/board/${NewsBoardSlug}`;
  title: string;
  description: string;
};

export const NEWS_BOARD_ITEMS: NewsBoardConfig[] = [
  {
    slug: "news-local",
    href: "/board/news-local",
    title: "호치민/현지 뉴스",
    description: "호치민·사이공·베트남 현지 정책, 여행, 생활 정보",
  },
  {
    slug: "news-world",
    href: "/board/news-world",
    title: "한국/세계 뉴스",
    description: "한국·교민·글로벌 경제·기업 소식",
  },
  {
    slug: "news-community",
    href: "/board/news-community",
    title: "교민/단톡방 소식",
    description: "교민 커뮤니티·칼럼·현지 소통 이슈",
  },
];

export function getNewsBoardConfig(
  slug: string
): NewsBoardConfig | undefined {
  return NEWS_BOARD_ITEMS.find((b) => b.slug === slug);
}

export function isNewsSectionPath(pathname: string): boolean {
  return (
    pathname === "/news" ||
    pathname.startsWith("/news/") ||
    pathname.startsWith("/board/news")
  );
}
