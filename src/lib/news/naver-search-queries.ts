import type { PostTopic } from "@/generated/prisma/client";
import type { NewsFeedSource } from "@/lib/news/sources";
import type { NewsIngestTier } from "@/lib/news/news-ingest-tier";

type NaverRow = { query: string; sourceName?: string; tier?: NewsIngestTier };

/**
 * 한국어 네이버 검색 — 베트남+교민/진출/안전 중심
 *
 * - OFFICIAL: 대사관·KOTRA·한인회 (별도 official-notice-feeds와 병행)
 * - SAFETY_VISA: 안전·비자·체류
 * - LIVING: 물가·생활·관광 실용 정보
 * - GENERAL: 교민·진출 일반
 */
const NAVER_QUERY_ROWS: Record<PostTopic, NaverRow[]> = {
  KOREA: [
    { query: "베트남 교민", tier: "GENERAL" },
    { query: "베트남 진출", tier: "GENERAL" },
    { query: "베트남 안전", tier: "SAFETY_VISA" },
    { query: "호치민 한인", tier: "GENERAL" },
    { query: "베트남 거주 한국인", tier: "LIVING" },
    { query: "호치민 한국 기업", tier: "GENERAL" },
  ],
  TRAVEL: [
    { query: "베트남 여행 한국인", tier: "GENERAL" },
    { query: "한국인 호치민 여행", tier: "GENERAL" },
    { query: "베트남 항공", tier: "GENERAL" },
  ],
  VIETNAM_POLICY: [
    { query: "베트남 비자 한국인", tier: "SAFETY_VISA" },
    { query: "베트남 E-visa", tier: "SAFETY_VISA" },
    { query: "호치민 거주증", tier: "SAFETY_VISA" },
    { query: "베트남 체류 연장", tier: "SAFETY_VISA" },
    { query: "베트남 노동허가", tier: "SAFETY_VISA" },
    { query: "베트남 안전 한국인", tier: "SAFETY_VISA" },
  ],
  TOURIST: [
    { query: "호치민 관광", tier: "LIVING" },
    { query: "베트남 물가", tier: "LIVING" },
    { query: "호치민 생활", tier: "LIVING" },
    { query: "호치민 여행 안전", tier: "SAFETY_VISA" },
    { query: "다낭 관광 한국인", tier: "LIVING" },
  ],
};

export function naverFeedsForTopic(topic: PostTopic): NewsFeedSource[] {
  return NAVER_QUERY_ROWS[topic].map((row) => ({
    type: "naver" as const,
    query: row.query,
    sourceName: row.sourceName ?? "네이버 뉴스",
    tier: row.tier,
  }));
}

export function listNaverSearchQueries(): Record<PostTopic, string[]> {
  return {
    KOREA: NAVER_QUERY_ROWS.KOREA.map((r) => r.query),
    TRAVEL: NAVER_QUERY_ROWS.TRAVEL.map((r) => r.query),
    VIETNAM_POLICY: NAVER_QUERY_ROWS.VIETNAM_POLICY.map((r) => r.query),
    TOURIST: NAVER_QUERY_ROWS.TOURIST.map((r) => r.query),
  };
}
