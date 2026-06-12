/** 호치민·베트남 교민 게시글 지역 태그 */
export const HOCHIMINH_REGIONS = [
  { slug: "district-1", label: "1군" },
  { slug: "district-2", label: "2군" },
  { slug: "district-7", label: "7군" },
  { slug: "binh-thanh", label: "빈탄" },
  { slug: "thu-duc", label: "투덕" },
  { slug: "bien-hoa", label: "비엔호아" },
  { slug: "hanoi", label: "하노이" },
  { slug: "danang", label: "다낭" },
  { slug: "other", label: "기타" },
] as const;

export type RegionSlug = (typeof HOCHIMINH_REGIONS)[number]["slug"];

const slugSet = new Set<string>(HOCHIMINH_REGIONS.map((r) => r.slug));
const labelBySlug = new Map<string, string>(
  HOCHIMINH_REGIONS.map((r) => [r.slug, r.label])
);

export function isValidRegion(slug: string | null | undefined): slug is RegionSlug {
  return Boolean(slug && slugSet.has(slug));
}

export function getRegionLabel(slug: string | null | undefined): string | undefined {
  if (!slug) return undefined;
  return labelBySlug.get(slug);
}

/** URL `region` 쿼리 → DB 필터용 slug (없거나 all이면 undefined) */
export function parseRegionParam(
  param: string | null | undefined
): RegionSlug | undefined {
  if (!param || param === "all") return undefined;
  return isValidRegion(param) ? param : undefined;
}
