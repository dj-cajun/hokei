import type { PostTopic } from "@/generated/prisma/client";
import type { NewsFeedSource } from "@/lib/news/sources";

/**
 * 네이버 뉴스 검색어 — 베트남 거주 한국 교민·베트남 방문 한국인 여행객 관심사
 *
 * - KOREA: 한인 사회·생활·사업·커뮤니티 (호치민·사이공·하노이)
 * - TRAVEL: 한국 출발·항공·한국인 맞춤 여행
 * - VIETNAM_POLICY: 비자·체류·입국·노동·규정
 * - TOURIST: 현지 관광·입국·안전·여행지 (한국인 키워드 없어도 허용)
 */
const NAVER_QUERY_ROWS: Record<
  PostTopic,
  { query: string; sourceName?: string }[]
> = {
  KOREA: [
    { query: "호치민 한인" },
    { query: "사이공 한국 교민" },
    { query: "호치민 한인회" },
    { query: "베트남 거주 한국인" },
    { query: "호치민 한국 기업" },
    { query: "하노이 한국인" },
  ],
  TRAVEL: [
    { query: "한국인 호치민 여행" },
    { query: "한국인 다낭 여행" },
    { query: "베트남 여행 항공" },
    { query: "대한항공 호치민" },
    { query: "아시아나 호치민" },
    { query: "진에어 베트남" },
  ],
  VIETNAM_POLICY: [
    { query: "베트남 비자 한국인" },
    { query: "베트남 E-visa" },
    { query: "호치민 거주증" },
    { query: "베트남 체류 연장" },
    { query: "호치민 외국인 입국" },
    { query: "베트남 노동허가" },
  ],
  TOURIST: [
    { query: "호치민 관광" },
    { query: "호치민 여행지" },
    { query: "다낭 관광 한국인" },
    { query: "베트남 입국 한국인" },
    { query: "호치민 여행 안전" },
    { query: "나트랑 여행" },
  ],
};

export function naverFeedsForTopic(topic: PostTopic): NewsFeedSource[] {
  return NAVER_QUERY_ROWS[topic].map((row) => ({
    type: "naver" as const,
    query: row.query,
    sourceName: row.sourceName ?? "네이버 뉴스",
  }));
}

/** 관리·문서용 — 토픽별 검색어 목록 */
export function listNaverSearchQueries(): Record<PostTopic, string[]> {
  return {
    KOREA: NAVER_QUERY_ROWS.KOREA.map((r) => r.query),
    TRAVEL: NAVER_QUERY_ROWS.TRAVEL.map((r) => r.query),
    VIETNAM_POLICY: NAVER_QUERY_ROWS.VIETNAM_POLICY.map((r) => r.query),
    TOURIST: NAVER_QUERY_ROWS.TOURIST.map((r) => r.query),
  };
}
