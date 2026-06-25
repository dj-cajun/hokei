import type { LifeDomain, LifeGuideKind } from "@/generated/prisma/client";

export const LIFE_DOMAIN_LABELS: Record<LifeDomain, string> = {
  CLOTHES: "의 (衣)",
  FOOD: "식 (食)",
  HOUSING: "주 (住)",
  ADMIN: "행정·법률",
  TRANSPORT: "교통·금융",
  EDUCATION: "교육·문화",
  STUDY: "베트남어 공부",
};

export const LIFE_KIND_LABELS: Record<LifeGuideKind, string> = {
  PHRASE: "생활 외국어",
  DOC: "오피셜 자료",
};

/** /life 위키 탭 (공부 제외) */
export const LIFE_WIKI_DOMAIN_ORDER: LifeDomain[] = [
  "FOOD",
  "CLOTHES",
  "HOUSING",
  "ADMIN",
  "TRANSPORT",
  "EDUCATION",
];

/** @deprecated use LIFE_WIKI_DOMAIN_ORDER on /life */
export const LIFE_DOMAIN_ORDER: LifeDomain[] = [
  ...LIFE_WIKI_DOMAIN_ORDER,
  "STUDY",
];
