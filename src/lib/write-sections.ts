/** 글쓰기 가능한 상위 섹션 (뉴스 제외) */
export const WRITABLE_SECTION_SLUGS = [
  "jobs",
  "real-estate",
  "classifieds",
  "promo",
  "community",
] as const;

export type WritableSectionSlug = (typeof WRITABLE_SECTION_SLUGS)[number];

export function isWritableSection(
  slug: string
): slug is WritableSectionSlug {
  return (WRITABLE_SECTION_SLUGS as readonly string[]).includes(slug);
}

export const WRITE_SECTION_META: Record<
  string,
  { title: string; defaultCategorySlug?: string }
> = {
  jobs: {
    title: "구인·구직 글쓰기",
    defaultCategorySlug: "jobs-hiring",
  },
  "real-estate": {
    title: "부동산 글쓰기",
    defaultCategorySlug: "real-estate-tenant-seeking",
  },
  classifieds: {
    title: "중고 글쓰기",
    defaultCategorySlug: "classifieds-selling",
  },
  promo: {
    title: "여기 어때 글쓰기",
    defaultCategorySlug: "promo-store-hungry",
  },
  community: {
    title: "커뮤니티 글쓰기",
    defaultCategorySlug: "community-free-board",
  },
};

export function getWriteHref(sectionSlug?: string): string {
  if (!sectionSlug) return "/write";
  return `/write?section=${sectionSlug}`;
}
