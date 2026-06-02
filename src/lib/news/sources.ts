import type { PostTopic } from "@/generated/prisma/client";
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
      { type: "naver", query: "호치민 한인", sourceName: "네이버 뉴스" },
      { type: "naver", query: "사이공 한국 교민", sourceName: "네이버 뉴스" },
      { type: "naver", query: "베트남 한국 기업", sourceName: "네이버 뉴스" },
      ...VNEXPRESS_NAVER_FEEDS.korea,
      ...VNEXPRESS_INTERNATIONAL_FEEDS.korea,
    ],
  },
  {
    topic: "TRAVEL",
    label: "여행",
    categorySlug: "news",
    feeds: [
      { type: "naver", query: "호치민 여행", sourceName: "네이버 뉴스" },
      { type: "naver", query: "한국인 호치민 여행", sourceName: "네이버 뉴스" },
      { type: "naver", query: "사이공 여행 한국인", sourceName: "네이버 뉴스" },
      { type: "naver", query: "대한항공 호치민", sourceName: "네이버 뉴스" },
      ...VNEXPRESS_NAVER_FEEDS.travel,
    ],
  },
  {
    topic: "VIETNAM_POLICY",
    label: "베트남 정책",
    categorySlug: "news-visa-residency",
    feeds: [
      { type: "naver", query: "베트남 비자 정책", sourceName: "네이버 뉴스" },
      { type: "naver", query: "호치민 거주증", sourceName: "네이버 뉴스" },
      { type: "naver", query: "호치민 외국인 입국", sourceName: "네이버 뉴스" },
      ...VNEXPRESS_NAVER_FEEDS.policy,
      ...VNEXPRESS_INTERNATIONAL_FEEDS.policy,
    ],
  },
  {
    topic: "TOURIST",
    label: "여행객 정보",
    categorySlug: "news",
    feeds: [
      { type: "naver", query: "호치민 관광", sourceName: "네이버 뉴스" },
      { type: "naver", query: "한국인 베트남 여행객", sourceName: "네이버 뉴스" },
      { type: "naver", query: "사이공 한인", sourceName: "네이버 뉴스" },
    ],
  },
];

export const MAX_DAILY_NEWS = 10;

export const TOPIC_LABELS: Record<PostTopic, string> = {
  KOREA: "한국",
  TRAVEL: "여행",
  VIETNAM_POLICY: "베트남 정책",
  TOURIST: "여행객",
};
