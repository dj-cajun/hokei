import type { NewsFeedSource } from "@/lib/news/sources";

/**
 * 공지·기관 (신뢰도 우선) — 네이버 검색 + RSS
 * 대사관·KOTRA·한인회·상공회의소 등
 */
export const OFFICIAL_NOTICE_FEEDS: NewsFeedSource[] = [
  {
    type: "naver",
    query: "주베트남 대한민국 대사관",
    sourceName: "주베트남 한국대사관",
    tier: "OFFICIAL",
  },
  {
    type: "naver",
    query: "베트남 대한민국 대사관 공지",
    sourceName: "주베트남 한국대사관",
    tier: "OFFICIAL",
  },
  {
    type: "naver",
    query: "코트라 베트남",
    sourceName: "KOTRA 베트남",
    tier: "OFFICIAL",
  },
  {
    type: "naver",
    query: "KOTRA 호치민",
    sourceName: "KOTRA 베트남",
    tier: "OFFICIAL",
  },
  {
    type: "naver",
    query: "호치민 한인회 공지",
    sourceName: "호치민 한인회",
    tier: "OFFICIAL",
  },
  {
    type: "naver",
    query: "사이공 한인회",
    sourceName: "사이공 한인회",
    tier: "OFFICIAL",
  },
  {
    type: "naver",
    query: "베트남 한국상공회의소",
    sourceName: "한국상공회의소",
    tier: "OFFICIAL",
  },
];

export function isOfficialNoticeSource(
  sourceName?: string,
  link?: string
): boolean {
  const text = `${sourceName ?? ""} ${link ?? ""}`;
  return /대사관|consulate|embassy|mofa\.go\.kr|overseas\.mofa|KOTRA|kotra\.|한인회|korcham|상공회의소|MOFA/i.test(
    text
  );
}
