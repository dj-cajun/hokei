import type { PostTopic } from "@/generated/prisma/client";
import type { NewsFeedSource } from "@/lib/news/sources";

/**
 * 현지 신문 RSS (베트남어·영어) — 수집 후 한국어 번역
 * 본문·제목에 Người Hàn Quốc, Đầu tư, An ninh 등 키워드 필터
 */
export const VIETNAM_LOCAL_RSS_FEEDS: Record<
  PostTopic,
  NewsFeedSource[]
> = {
  KOREA: [
    {
      type: "rss",
      url: "https://vnexpress.net/rss/home.rss",
      sourceName: "VnExpress",
      tier: "GENERAL",
    },
    {
      type: "rss",
      url: "https://e.vnexpress.net/rss/news.rss",
      sourceName: "VnExpress International",
      tier: "GENERAL",
    },
    {
      type: "rss",
      url: "https://tuoitre.vn/rss/tin-moi-nhat.rss",
      sourceName: "Tuổi Trẻ",
      tier: "GENERAL",
    },
  ],
  TRAVEL: [
    {
      type: "rss",
      url: "https://e.vnexpress.net/rss/travel.rss",
      sourceName: "VnExpress International · Travel",
      tier: "GENERAL",
    },
  ],
  VIETNAM_POLICY: [
    {
      type: "rss",
      url: "https://vnexpress.net/rss/phap-luat.rss",
      sourceName: "VnExpress · Pháp luật",
      tier: "SAFETY_VISA",
    },
    {
      type: "rss",
      url: "https://e.vnexpress.net/rss/news.rss",
      sourceName: "VnExpress International",
      tier: "SAFETY_VISA",
    },
  ],
  TOURIST: [
    {
      type: "rss",
      url: "https://e.vnexpress.net/rss/travel.rss",
      sourceName: "VnExpress International · Travel",
      tier: "LIVING",
    },
    {
      type: "rss",
      url: "https://vnexpress.net/rss/du-lich.rss",
      sourceName: "VnExpress · Du lịch",
      tier: "LIVING",
    },
  ],
};

/** 네이버 — 현지 매체 한국인·투자·안전 (베트남어 키워드 로마자 검색) */
export const VIETNAM_LOCAL_NAVER_FEEDS: NewsFeedSource[] = [
  {
    type: "naver",
    query: "VnExpress người Hàn Quốc",
    sourceName: "VnExpress",
    tier: "GENERAL",
  },
  {
    type: "naver",
    query: "베트남 한국인 투자",
    sourceName: "Tuổi Trẻ",
    tier: "GENERAL",
  },
  {
    type: "naver",
    query: "호치민 안전 한국인",
    sourceName: "VnExpress",
    tier: "SAFETY_VISA",
  },
];
