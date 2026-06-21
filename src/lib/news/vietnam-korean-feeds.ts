import type { PostTopic } from "@/generated/prisma/client";
import type { NewsFeedSource } from "@/lib/news/sources";
import { LAODONG_KO_SITEMAP_URL } from "@/lib/news/laodong-ko-feed";

/** 라오동신문 한국어판 — ko.laodong.vn sitemap */
export const LAODONG_KO_FEEDS: Record<
  "korea" | "travel" | "policy" | "tourist",
  NewsFeedSource[]
> = {
  korea: [
    {
      type: "rss",
      url: LAODONG_KO_SITEMAP_URL,
      sourceName: "라오동신문",
    },
  ],
  travel: [
    {
      type: "rss",
      url: LAODONG_KO_SITEMAP_URL,
      sourceName: "라오동신문",
    },
  ],
  policy: [
    {
      type: "rss",
      url: LAODONG_KO_SITEMAP_URL,
      sourceName: "라오동신문 · 노동·정책",
      tier: "SAFETY_VISA",
    },
  ],
  tourist: [
    {
      type: "rss",
      url: LAODONG_KO_SITEMAP_URL,
      sourceName: "라오동신문",
      tier: "LIVING",
    },
  ],
};

/** 인사이드비나 — 한국어 RSS (https://www.insidevina.com/rssIndex.html) */
export const INSIDEVINA_RSS_FEEDS: Record<
  "korea" | "travel" | "policy" | "tourist",
  NewsFeedSource[]
> = {
  korea: [
    {
      type: "rss",
      url: "https://www.insidevina.com/rss/allArticle.xml",
      sourceName: "인사이드비나",
    },
    {
      type: "rss",
      url: "https://www.insidevina.com/rss/S1N10.xml",
      sourceName: "인사이드비나 · 베트남 인사이트",
    },
  ],
  travel: [
    {
      type: "rss",
      url: "https://www.insidevina.com/rss/S1N8.xml",
      sourceName: "인사이드비나 · 여행·로컬",
    },
  ],
  policy: [
    {
      type: "rss",
      url: "https://www.insidevina.com/rss/S1N12.xml",
      sourceName: "인사이드비나 · 금융·부동산",
    },
    {
      type: "rss",
      url: "https://www.insidevina.com/rss/S1N5.xml",
      sourceName: "인사이드비나 · 정치",
    },
  ],
  tourist: [
    {
      type: "rss",
      url: "https://www.insidevina.com/rss/S1N9.xml",
      sourceName: "인사이드비나 · 사회·문화",
    },
  ],
};

/** Vietnam.vn — 한국어판 RSS */
export const VIETNAM_VN_KO_RSS: NewsFeedSource = {
  type: "rss",
  url: "https://www.vietnam.vn/ko/sitemap.rss",
  sourceName: "Vietnam.vn",
};

export const VIETNAM_VN_RSS_FEEDS: Record<
  "korea" | "travel" | "policy" | "tourist",
  NewsFeedSource[]
> = {
  korea: [VIETNAM_VN_KO_RSS],
  travel: [VIETNAM_VN_KO_RSS],
  policy: [VIETNAM_VN_KO_RSS],
  tourist: [VIETNAM_VN_KO_RSS],
};

/** INGEST_RSS_ONLY=1 시 VnExpress 폴백에 합쳐 사용 */
export const VIETNAM_KOREAN_RSS_FALLBACK_FEEDS: Record<
  PostTopic,
  NewsFeedSource[]
> = {
  KOREA: [
    ...INSIDEVINA_RSS_FEEDS.korea,
    ...VIETNAM_VN_RSS_FEEDS.korea,
    ...LAODONG_KO_FEEDS.korea,
  ],
  TRAVEL: [
    ...INSIDEVINA_RSS_FEEDS.travel,
    ...VIETNAM_VN_RSS_FEEDS.travel,
    ...LAODONG_KO_FEEDS.travel,
  ],
  VIETNAM_POLICY: [
    ...INSIDEVINA_RSS_FEEDS.policy,
    ...VIETNAM_VN_RSS_FEEDS.policy,
    ...LAODONG_KO_FEEDS.policy,
  ],
  TOURIST: [
    ...INSIDEVINA_RSS_FEEDS.tourist,
    ...VIETNAM_VN_RSS_FEEDS.tourist,
    ...LAODONG_KO_FEEDS.tourist,
  ],
};
