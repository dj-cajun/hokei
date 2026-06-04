import type { PostTopic } from "@/generated/prisma/client";
import type { NewsIngestTier } from "@/lib/news/news-ingest-tier";
import { googleNewsFeedsForKorea } from "@/lib/news/google-news-feeds";
import { naverFeedsForTopic } from "@/lib/news/naver-search-queries";
import { OFFICIAL_NOTICE_FEEDS } from "@/lib/news/official-notice-feeds";
import {
  INSIDEVINA_RSS_FEEDS,
  VIETNAM_VN_RSS_FEEDS,
} from "@/lib/news/vietnam-korean-feeds";
import {
  VIETNAM_LOCAL_NAVER_FEEDS,
  VIETNAM_LOCAL_RSS_FEEDS,
} from "@/lib/news/vietnam-local-feeds";
import {
  VNEXPRESS_INTERNATIONAL_FEEDS,
  VNEXPRESS_NAVER_FEEDS,
} from "@/lib/news/vnexpress-feeds";

export type NewsFeedSource =
  | { type: "rss"; url: string; sourceName: string; tier?: NewsIngestTier }
  | { type: "naver"; query: string; sourceName: string; tier?: NewsIngestTier };

export type NewsTopicConfig = {
  topic: PostTopic;
  label: string;
  categorySlug: string;
  feeds: NewsFeedSource[];
};

function dedupeFeeds(feeds: NewsFeedSource[]): NewsFeedSource[] {
  const seen = new Set<string>();
  const out: NewsFeedSource[] = [];
  for (const feed of feeds) {
    const key =
      feed.type === "rss" ? `rss:${feed.url}` : `naver:${feed.query}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(feed);
  }
  return out;
}

/**
 * 뉴스 소스 마스터
 * - 한국어: 네이버·Google RSS (베트남+교민/진출/안전)
 * - 현지: VnExpress·Tuổi Trẻ RSS → 번역
 * - 공지: 대사관·KOTRA·한인회 (OFFICIAL 티어)
 * - 일일 수집 비율: ingest-mix.ts (20/30/30/20)
 */
export const NEWS_TOPIC_SOURCES: NewsTopicConfig[] = [
  {
    topic: "KOREA",
    label: "한국",
    categorySlug: "news",
    feeds: dedupeFeeds([
      ...OFFICIAL_NOTICE_FEEDS,
      ...naverFeedsForTopic("KOREA"),
      ...googleNewsFeedsForKorea(),
      ...VNEXPRESS_NAVER_FEEDS.korea,
      ...VIETNAM_LOCAL_RSS_FEEDS.KOREA,
      ...VIETNAM_LOCAL_NAVER_FEEDS.filter((f) => f.tier !== "SAFETY_VISA"),
      ...INSIDEVINA_RSS_FEEDS.korea,
      ...VIETNAM_VN_RSS_FEEDS.korea,
    ]),
  },
  {
    topic: "TRAVEL",
    label: "여행",
    categorySlug: "news",
    feeds: dedupeFeeds([
      ...naverFeedsForTopic("TRAVEL"),
      ...VNEXPRESS_NAVER_FEEDS.travel,
      ...VIETNAM_LOCAL_RSS_FEEDS.TRAVEL,
      ...INSIDEVINA_RSS_FEEDS.travel,
      ...VIETNAM_VN_RSS_FEEDS.travel,
    ]),
  },
  {
    topic: "VIETNAM_POLICY",
    label: "베트남 정책",
    categorySlug: "news-visa-residency",
    feeds: dedupeFeeds([
      ...naverFeedsForTopic("VIETNAM_POLICY"),
      ...VNEXPRESS_NAVER_FEEDS.policy,
      ...VNEXPRESS_INTERNATIONAL_FEEDS.policy,
      ...VIETNAM_LOCAL_RSS_FEEDS.VIETNAM_POLICY,
      ...VIETNAM_LOCAL_NAVER_FEEDS.filter((f) => f.tier === "SAFETY_VISA"),
      ...INSIDEVINA_RSS_FEEDS.policy,
      ...VIETNAM_VN_RSS_FEEDS.policy,
    ]),
  },
  {
    topic: "TOURIST",
    label: "여행객 정보",
    categorySlug: "news",
    feeds: dedupeFeeds([
      ...naverFeedsForTopic("TOURIST"),
      ...VIETNAM_LOCAL_RSS_FEEDS.TOURIST,
      ...INSIDEVINA_RSS_FEEDS.tourist,
      ...VIETNAM_VN_RSS_FEEDS.tourist,
    ]),
  },
];

export const MAX_DAILY_NEWS = 15;

export const TOPIC_LABELS: Record<PostTopic, string> = {
  KOREA: "한국",
  TRAVEL: "여행",
  VIETNAM_POLICY: "베트남 정책",
  TOURIST: "여행객",
};
