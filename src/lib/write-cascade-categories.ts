/** 글쓰기 3단계 말머리 (대분류 → 중분류 → 소분류) */
export const WRITE_CASCADE_CATEGORIES = {
  부동산: {
    방구함: ["원룸", "투룸", "스튜디오", "아파트", "하우스"],
    방내놓음: ["원룸", "투룸", "스튜디오", "아파트", "하우스"],
  },
  취업: {
    구인: ["풀타임", "파트타임", "알바", "계약직"],
    구직: ["풀타임", "파트타임", "알바", "계약직"],
  },
  중고거래: {
    팝니다: ["판매중", "예약중", "거래완료"],
    삽니다: ["구매중", "구매완료"],
    나눔: ["나눔중", "나눔완료"],
  },
} as const;

export type CascadeMainCategory = keyof typeof WRITE_CASCADE_CATEGORIES;

export const CASCADE_WRITE_SECTIONS = [
  "real-estate",
  "jobs",
  "classifieds",
] as const;

export type CascadeWriteSection = (typeof CASCADE_WRITE_SECTIONS)[number];

export function isCascadeWriteSection(
  slug: string | undefined
): slug is CascadeWriteSection {
  return (
    slug !== undefined &&
    (CASCADE_WRITE_SECTIONS as readonly string[]).includes(slug)
  );
}

export const SECTION_TO_MAIN: Record<CascadeWriteSection, CascadeMainCategory> = {
  "real-estate": "부동산",
  jobs: "취업",
  classifieds: "중고거래",
};

export const MAIN_TO_SECTION: Record<CascadeMainCategory, CascadeWriteSection> = {
  부동산: "real-estate",
  취업: "jobs",
  중고거래: "classifieds",
};

/** 중분류 → DB 하위 카테고리 slug */
export const MID_TO_CATEGORY_SLUG: Record<
  CascadeWriteSection,
  Partial<Record<string, string>>
> = {
  "real-estate": {
    방구함: "real-estate-apartment-rent",
    방내놓음: "real-estate-apartment-rent",
  },
  jobs: {
    구인: "jobs-hiring",
    구직: "jobs-job-seeking",
  },
  classifieds: {
    팝니다: "classifieds-buy-sell",
    삽니다: "classifieds-buy-sell",
    나눔: "classifieds-buy-sell",
  },
};

const TITLE_PREFIX_RE = /^\[([^/]+)\/([^\]]+)\]\s*(.*)$/;

export function buildCascadeTitle(
  midCategory: string,
  subCategory: string,
  rawTitle: string
): string {
  const base = rawTitle.trim();
  if (!midCategory || !subCategory) return base;
  const prefix = `[${midCategory}/${subCategory}]`;
  if (base.startsWith(prefix)) return base;
  return base ? `${prefix} ${base}` : prefix;
}

export function parseCascadeTitle(title: string): {
  midCategory: string;
  subCategory: string;
  rawTitle: string;
} | null {
  const m = title.trim().match(TITLE_PREFIX_RE);
  if (!m) return null;
  return {
    midCategory: m[1]!.trim(),
    subCategory: m[2]!.trim(),
    rawTitle: m[3]!.trim(),
  };
}

export function getMidOptions(
  main: CascadeMainCategory | ""
): string[] {
  if (!main) return [];
  return Object.keys(WRITE_CASCADE_CATEGORIES[main]);
}

export function getSubOptions(
  main: CascadeMainCategory | "",
  mid: string
): string[] {
  if (!main || !mid) return [];
  const tree = WRITE_CASCADE_CATEGORIES[main];
  const subs = Object.entries(tree).find(([key]) => key === mid)?.[1];
  return subs ? [...subs] : [];
}

export function resolveCategoryIdFromCascade(
  sectionSlug: CascadeWriteSection,
  midCategory: string,
  categories: { id: string; slug: string }[],
  fallbackId: string
): string {
  const slug = MID_TO_CATEGORY_SLUG[sectionSlug]?.[midCategory];
  if (!slug) return fallbackId;
  return categories.find((c) => c.slug === slug)?.id ?? fallbackId;
}
