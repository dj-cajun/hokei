export type CurateKakaoContentType =
  | "VIETNAMESE_STUDY"
  | "REAL_ESTATE"
  | "CLASSIFIED"
  | "JOBS"
  | "PROMO"
  | "UNKNOWN";

export const CURATE_CONTENT_TYPE_LABELS: Record<CurateKakaoContentType, string> =
  {
    VIETNAMESE_STUDY: "교민 베트남어 공부",
    REAL_ESTATE: "부동산 & 임대",
    CLASSIFIED: "중고 거래",
    JOBS: "취업 & 비즈니스",
    PROMO: "한인 업소 홍보",
    UNKNOWN: "분류 불가",
  };

export const PUBLISHABLE_CURATE_TYPES: CurateKakaoContentType[] = [
  "VIETNAMESE_STUDY",
  "REAL_ESTATE",
  "CLASSIFIED",
  "JOBS",
  "PROMO",
];
