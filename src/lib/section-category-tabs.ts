export type SectionCategoryTab = {
  label: string;
  href: string;
};

/** 지역 탭 대신 하위 카테고리 탭을 쓰는 섹션 */
export const SECTION_CATEGORY_TAB_SLUGS = new Set([
  "jobs",
  "real-estate",
  "classifieds",
]);

export function usesSectionCategoryTabs(sectionSlug: string): boolean {
  return SECTION_CATEGORY_TAB_SLUGS.has(sectionSlug);
}

export function mapSectionCategoryTabs(
  children: { label: string; href: string }[]
): SectionCategoryTab[] {
  return children.map((child) => ({
    label: child.label,
    href: child.href,
  }));
}
