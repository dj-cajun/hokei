import type { NewsFeedSource } from "@/lib/news/sources";

/** VnExpress — 네이버 뉴스 검색으로 한국어 기사 발견 */
export const VNEXPRESS_NAVER_FEEDS: Record<
  "korea" | "travel" | "policy",
  NewsFeedSource[]
> = {
  korea: [
    { type: "naver", query: "VnExpress 한국", sourceName: "VnExpress" },
    { type: "naver", query: "베트남익스프레스 한국", sourceName: "VnExpress" },
  ],
  travel: [
    {
      type: "naver",
      query: "VnExpress 한국인 여행",
      sourceName: "VnExpress",
    },
  ],
  policy: [
    { type: "naver", query: "VnExpress 비자", sourceName: "VnExpress" },
    { type: "naver", query: "베트남 비자 VnExpress", sourceName: "VnExpress" },
  ],
};

/** VnExpress International (영문 RSS) — Z.AI/Gemini 한국어 변환 */
export const VNEXPRESS_INTERNATIONAL_FEEDS: Record<
  "korea" | "policy",
  NewsFeedSource[]
> = {
  korea: [
    {
      type: "rss",
      url: "https://e.vnexpress.net/rss/news.rss",
      sourceName: "VnExpress International",
    },
  ],
  policy: [
    {
      type: "rss",
      url: "https://e.vnexpress.net/rss/news.rss",
      sourceName: "VnExpress International · News",
    },
  ],
};
