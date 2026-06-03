import type { PostTopic } from "@/generated/prisma/client";
import { naverFeedsForTopic } from "@/lib/news/naver-search-queries";
import {
  INSIDEVINA_RSS_FEEDS,
  VIETNAM_VN_RSS_FEEDS,
} from "@/lib/news/vietnam-korean-feeds";
import {
  VNEXPRESS_INTERNATIONAL_FEEDS,
  VNEXPRESS_NAVER_FEEDS,
} from "@/lib/news/vnexpress-feeds";

export type NewsFeedSource =
  | { type: "rss"; url: string; sourceName: string }
  | { type: "naver"; query: string; sourceName: string };

export type NewsTopicConfig = {
  topic: PostTopic;
  label: string;
  categorySlug: string;
  feeds: NewsFeedSource[];
};

/** 네이버 뉴스 검색어 — 호치민·사이공·베트남 교민 중심 (미국 교포·보스턴 등 광범위 키워드 제외) */
export const NEWS_TOPIC_SOURCES: NewsTopicConfig[] = [
  {
    topic: "KOREA",
    label: "한국",
    categorySlug: "news",
    feeds: [
      ...naverFeedsForTopic("KOREA"),
      ...VNEXPRESS_NAVER_FEEDS.korea,
      ...VNEXPRESS_INTERNATIONAL_FEEDS.korea,
      ...INSIDEVINA_RSS_FEEDS.korea,
      ...VIETNAM_VN_RSS_FEEDS.korea,
    ],
  },
  {
    topic: "TRAVEL",
    label: "여행",
    categorySlug: "news",
    feeds: [
      ...naverFeedsForTopic("TRAVEL"),
      ...VNEXPRESS_NAVER_FEEDS.travel,
      ...INSIDEVINA_RSS_FEEDS.travel,
      ...VIETNAM_VN_RSS_FEEDS.travel,
    ],
  },
  {
    topic: "VIETNAM_POLICY",
    label: "베트남 정책",
    categorySlug: "news-visa-residency",
    feeds: [
      ...naverFeedsForTopic("VIETNAM_POLICY"),
      ...VNEXPRESS_NAVER_FEEDS.policy,
      ...VNEXPRESS_INTERNATIONAL_FEEDS.policy,
      ...INSIDEVINA_RSS_FEEDS.policy,
      ...VIETNAM_VN_RSS_FEEDS.policy,
    ],
  },
  {
    topic: "TOURIST",
    label: "여행객 정보",
    categorySlug: "news",
    feeds: [
      ...naverFeedsForTopic("TOURIST"),
      ...INSIDEVINA_RSS_FEEDS.tourist,
      ...VIETNAM_VN_RSS_FEEDS.tourist,
    ],
  },
];

export const MAX_DAILY_NEWS = 15;

export const TOPIC_LABELS: Record<PostTopic, string> = {
  KOREA: "한국",
  TRAVEL: "여행",
  VIETNAM_POLICY: "베트남 정책",
  TOURIST: "여행객",
};
