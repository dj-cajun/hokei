/** 찐 생활정보 허브 — 상단 탭에 묶이는 섹션 */
export const LIFE_INFO_SECTION_SLUGS = [
  "promo",
  "real-estate",
  "classifieds",
  "jobs",
] as const;

export type LifeInfoSectionSlug = (typeof LIFE_INFO_SECTION_SLUGS)[number];

export const LIFE_INFO_HUB_HREF = "/promo";

export function lifeInfoSectionSlugsForHub(): LifeInfoSectionSlug[] {
  return [...LIFE_INFO_SECTION_SLUGS];
}
