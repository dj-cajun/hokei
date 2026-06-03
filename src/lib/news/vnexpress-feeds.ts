import type { PostTopic } from "@/generated/prisma/client";
import type { NewsFeedSource } from "@/lib/news/sources";
import { VIETNAM_KOREAN_RSS_FALLBACK_FEEDS } from "@/lib/news/vietnam-korean-feeds";

/** VnExpress — 네이버 뉴스 검색으로 한국어 기사 발견 */
export const VNEXPRESS_NAVER_FEEDS: Record<
  "korea" | "travel" | "policy",
  NewsFeedSource[]
> = {
  korea: [
    { type: "naver", query: "VnExpress 호치민 한국인", sourceName: "VnExpress" },
    { type: "naver", query: "베트남익스프레스 교민", sourceName: "VnExpress" },
  ],
  travel: [
    {
      type: "naver",
      query: "VnExpress 한국인 베트남 여행",
      sourceName: "VnExpress",
    },
  ],
  policy: [
    { type: "naver", query: "VnExpress 베트남 비자", sourceName: "VnExpress" },
    {
      type: "naver",
      query: "베트남 비자 VnExpress 한국인",
      sourceName: "VnExpress",
    },
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

function mergeFeeds(
  ...groups: NewsFeedSource[][]
): NewsFeedSource[] {
  const seen = new Set<string>();
  const out: NewsFeedSource[] = [];
  for (const feed of groups.flat()) {
    const key =
      feed.type === "rss"
        ? `rss:${feed.url}`
        : `naver:${feed.query}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(feed);
  }
  return out;
}

/** 네이버 API 없을 때 Vercel·로컬 대체 (INGEST_RSS_ONLY=1) */
export const VNEXPRESS_RSS_FALLBACK_FEEDS: Record<PostTopic, NewsFeedSource[]> = {
  KOREA: mergeFeeds(
    VNEXPRESS_INTERNATIONAL_FEEDS.korea,
    VIETNAM_KOREAN_RSS_FALLBACK_FEEDS.KOREA
  ),
  TRAVEL: mergeFeeds(
    [
      {
        type: "rss",
        url: "https://e.vnexpress.net/rss/travel.rss",
        sourceName: "VnExpress International · Travel",
      },
    ],
    VIETNAM_KOREAN_RSS_FALLBACK_FEEDS.TRAVEL
  ),
  VIETNAM_POLICY: mergeFeeds(
    VNEXPRESS_INTERNATIONAL_FEEDS.policy,
    VIETNAM_KOREAN_RSS_FALLBACK_FEEDS.VIETNAM_POLICY
  ),
  TOURIST: mergeFeeds(
    [
      {
        type: "rss",
        url: "https://e.vnexpress.net/rss/travel.rss",
        sourceName: "VnExpress International · Tourist",
      },
    ],
    VIETNAM_KOREAN_RSS_FALLBACK_FEEDS.TOURIST
  ),
};
