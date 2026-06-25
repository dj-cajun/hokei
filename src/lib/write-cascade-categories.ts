/** 글쓰기 3단계 말머리 (대분류 → 중분류 → 소분류) */
export const WRITE_CASCADE_CATEGORIES = {
  부동산: {
    "임차인 구합니다": [
      "아파트",
      "단기·한달살기",
      "룸메이트",
      "스튜디오·원룸",
      "기타",
    ],
    "임대인 구합니다": [
      "아파트",
      "단기·한달살기",
      "룸메이트",
      "스튜디오·원룸",
      "기타",
    ],
  },
  취업: {
    구인: ["풀타임", "파트타임", "알바", "계약직", "프리랜스"],
    구직: ["풀타임", "파트타임", "알바", "계약직", "프리랜스"],
  },
  중고거래: {
    팝니다: ["가구·가전", "오토바이·차량", "생활용품", "기타"],
    삽니다: ["가구·가전", "오토바이·차량", "생활용품", "기타"],
  },
  여기어때: {
    배고플때: ["식당·맛집", "반찬·배달", "야식·간식", "공구·장터"],
    불편할때: ["병원·치과", "정비·세탁", "미용", "기타 서비스"],
  },
} as const;

export type CascadeMainCategory = keyof typeof WRITE_CASCADE_CATEGORIES;

export const CASCADE_MID_PLACEHOLDER: Record<CascadeMainCategory, string> = {
  부동산: "임차인 / 임대인 선택",
  취업: "구인 / 구직 선택",
  중고거래: "삽니다 / 팝니다 선택",
  여기어때: "배고플때 / 불편할때 선택",
};

export const CASCADE_SUB_PLACEHOLDER: Record<CascadeMainCategory, string> = {
  부동산: "매물 유형",
  취업: "고용 형태",
  중고거래: "품목",
  여기어때: "업종",
};

export const CASCADE_WRITE_SECTIONS = [
  "real-estate",
  "jobs",
  "classifieds",
  "promo",
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
  promo: "여기어때",
};

export const MAIN_TO_SECTION: Record<CascadeMainCategory, CascadeWriteSection> = {
  부동산: "real-estate",
  취업: "jobs",
  중고거래: "classifieds",
  여기어때: "promo",
};

/** 중분류 → DB 하위 카테고리 slug */
export const MID_TO_CATEGORY_SLUG: Record<
  CascadeWriteSection,
  Partial<Record<string, string>>
> = {
  "real-estate": {
    "임차인 구합니다": "real-estate-tenant-seeking",
    "임대인 구합니다": "real-estate-landlord-seeking",
  },
  jobs: {
    구인: "jobs-hiring",
    구직: "jobs-job-seeking",
  },
  classifieds: {
    팝니다: "classifieds-selling",
    삽니다: "classifieds-buying",
  },
  promo: {
    배고플때: "promo-store-hungry",
    불편할때: "promo-store-inconvenient",
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

/** DB leaf slug → 글쓰기 중분류(게시판 탭) */
export function resolveMidFromCategorySlug(
  sectionSlug: CascadeWriteSection,
  categorySlug: string
): string | null {
  const map = MID_TO_CATEGORY_SLUG[sectionSlug];
  for (const [mid, slug] of Object.entries(map)) {
    if (slug === categorySlug) return mid;
  }
  return null;
}
