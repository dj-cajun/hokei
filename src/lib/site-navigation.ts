import type { CategoryNavItem } from "@/lib/categories";
import { isNewsSectionPath } from "@/lib/news-boards-config";
import { LIFE_INFO_HUB_HREF, LIFE_INFO_SECTION_SLUGS } from "@/lib/life-info-hub";

export type HeaderDropdownItem = {
  label: string;
  href: string;
};

const LIFE_STUDY_CHILD: CategoryNavItem = {
  id: "site-life-study",
  slug: "life-study",
  label: "베트남어 공부",
  description: "매일 카톡 학습 표현 아카이브",
  href: "/life/study",
  icon: "GraduationCap",
  colorClass: "bg-violet-50 text-violet-700",
  children: [],
};

/** DB 카테고리 밖 v2.0 고정 메뉴 — 생활 가이드(베트남어 공부 포함) */
export const SITE_FEATURE_LINKS = [
  {
    id: "site-life",
    slug: "life",
    label: "생활 가이드",
    description: "의·식·주 외국어 · 행정 자료 · 베트남어 공부",
    href: "/life",
    icon: "BookOpen",
    colorClass: "bg-amber-50 text-amber-700",
  },
] as const;

const LIFE_INFO_SLUG_SET = new Set<string>(LIFE_INFO_SECTION_SLUGS);

export type SiteNavGroup = {
  id: string;
  label: string;
  items: CategoryNavItem[];
};

function buildLifeNavItem(): CategoryNavItem {
  const link = SITE_FEATURE_LINKS[0]!;
  return {
    id: link.id,
    slug: link.slug,
    label: link.label,
    description: link.description,
    href: link.href,
    icon: link.icon,
    colorClass: link.colorClass,
    children: [LIFE_STUDY_CHILD],
  };
}

/** 상단·사이드바 — 찐 생활정보 허브 (DB 3단계 트리 그대로 사용) */
export function buildLifeInfoHub(
  tree: CategoryNavItem[]
): CategoryNavItem | null {
  const bySlug = new Map(tree.map((s) => [s.slug, s]));
  const promo = bySlug.get("promo");
  const realEstate = bySlug.get("real-estate");
  const classifieds = bySlug.get("classifieds");
  const jobs = bySlug.get("jobs");

  const children: CategoryNavItem[] = [];

  if (promo) {
    for (const mid of promo.children) {
      children.push(mid);
    }
  }
  if (realEstate) {
    children.push(realEstate);
  }
  if (classifieds) {
    children.push(classifieds);
  }
  if (jobs) {
    children.push(jobs);
  }

  if (children.length === 0) return null;

  return {
    id: "site-life-info",
    slug: "life-info",
    label: "찐 생활정보",
    description: "맛집 · 부동산 · 중고 · 취업 한눈에",
    href: LIFE_INFO_HUB_HREF,
    icon: promo?.icon ?? "Flame",
    colorClass: promo?.colorClass ?? "bg-rose-50 text-rose-600",
    children,
  };
}

/** @deprecated buildLifeInfoHub 사용 */
export const buildKoreanBusinessHub = buildLifeInfoHub;

/** 사이드바용 — 정보 / 찐 생활정보 / 소통 그룹 */
export function buildSiteNavGroups(tree: CategoryNavItem[]): SiteNavGroup[] {
  const bySlug = new Map(tree.map((s) => [s.slug, s]));

  const news = bySlug.get("news");
  const community = bySlug.get("community");
  const lifeInfo = buildLifeInfoHub(tree);

  const infoItems: CategoryNavItem[] = [
    ...(news ? [news] : []),
    buildLifeNavItem(),
  ];

  const groups: SiteNavGroup[] = [];

  if (infoItems.length > 0) {
    groups.push({ id: "info", label: "정보", items: infoItems });
  }

  if (lifeInfo) {
    groups.push({ id: "life-info", label: "생활정보", items: [lifeInfo] });
  }

  if (community) {
    groups.push({ id: "community", label: "소통", items: [community] });
  }

  return groups;
}

/** 상단 스크롤 탭 — 뉴스 다음 생활가이드, 홍보·부동산·중고·취업은 찐 생활정보 허브로 */
export function buildHeaderNavSections(tree: CategoryNavItem[]): CategoryNavItem[] {
  const lifeInfo = buildLifeInfoHub(tree);
  const out: CategoryNavItem[] = [];

  for (const section of tree) {
    if (LIFE_INFO_SLUG_SET.has(section.slug)) continue;
    out.push(section);
    if (section.slug === "news") {
      out.push(buildLifeNavItem());
      if (lifeInfo) out.push(lifeInfo);
    }
  }

  return out;
}

export function isSiteFeaturePath(pathname: string): boolean {
  return pathname === "/life" || pathname.startsWith("/life/");
}

export function isLifeInfoPath(pathname: string): boolean {
  return (
    pathname === LIFE_INFO_HUB_HREF ||
    pathname.startsWith(`${LIFE_INFO_HUB_HREF}/`) ||
    pathname === "/real-estate" ||
    pathname.startsWith("/real-estate/") ||
    pathname === "/classifieds" ||
    pathname.startsWith("/classifieds/") ||
    pathname === "/jobs" ||
    pathname.startsWith("/jobs/")
  );
}

/** @deprecated isLifeInfoPath 사용 */
export const isKoreanBusinessPath = isLifeInfoPath;

/** 업체 타임라인 URL (서브카테고리 /promo/store 와 충돌 방지) */
export function promoStoreTimelineHref(storeSlug: string): string {
  return `/promo/timeline/${storeSlug}`;
}

function flattenNavDepth(items: CategoryNavItem[]): CategoryNavItem[] {
  const out: CategoryNavItem[] = [];
  for (const item of items) {
    out.push(item);
    if (item.children.length > 0) {
      out.push(...flattenNavDepth(item.children));
    }
  }
  return out;
}

/** 찐 생활정보 드롭다운용 — 허브 + 중간 부모만 (자식 leaf 제외) */
export function lifeInfoHubDropdownItems(
  section: CategoryNavItem
): HeaderDropdownItem[] {
  return [
    { label: "전체", href: LIFE_INFO_HUB_HREF },
    ...section.children.map((child) => ({
      label: child.label,
      href: child.href,
    })),
  ];
}

/** @deprecated lifeInfoHubDropdownItems 사용 */
export function flattenLifeInfoNavItems(
  section: CategoryNavItem
): CategoryNavItem[] {
  return flattenNavDepth(section.children);
}

export function normalizeNavPath(path: string): string {
  const base = path.split("?")[0]?.split("#")[0] ?? path;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

/** 상단 헤더 드롭다운 항목 */
export function getHeaderDropdownItems(
  section: CategoryNavItem
): HeaderDropdownItem[] {
  if (section.slug === "news") {
    return [
      { label: "전체 뉴스", href: "/news" },
      ...section.children.map((child) => ({
        label: child.label,
        href: child.href,
      })),
    ];
  }
  if (section.slug === "life") {
    return [
      { label: "생활 가이드", href: "/life" },
      ...section.children.map((child) => ({
        label: child.label,
        href: child.href,
      })),
    ];
  }
  if (section.slug === "life-info") {
    return lifeInfoHubDropdownItems(section);
  }
  return section.children.map((child) => ({
    label: child.label,
    href: child.href,
  }));
}

function scoreHeaderSectionMatch(
  path: string,
  section: CategoryNavItem,
  items: HeaderDropdownItem[]
): number {
  if (section.slug === "news" && isNewsSectionPath(path)) {
    return 1000 + path.length;
  }
  if (section.slug === "life" && isSiteFeaturePath(path)) {
    return 1000 + path.length;
  }
  if (section.slug === "life-info" && isLifeInfoPath(path)) {
    return 1000 + path.length;
  }

  const sectionHref = normalizeNavPath(section.href);
  if (path === sectionHref || path.startsWith(`${sectionHref}/`)) {
    return 500 + sectionHref.length;
  }

  let best = 0;
  for (const item of items) {
    const itemHref = normalizeNavPath(item.href);
    if (path === itemHref || path.startsWith(`${itemHref}/`)) {
      best = Math.max(best, 100 + itemHref.length);
    }
  }
  return best;
}

/** 현재 경로에 맞는 상단 탭 slug (하나만) */
export function resolveActiveHeaderSectionSlug(
  pathname: string,
  sections: CategoryNavItem[]
): string | null {
  const path = normalizeNavPath(pathname);
  let bestSlug: string | null = null;
  let bestScore = 0;

  for (const section of sections) {
    const items = getHeaderDropdownItems(section);
    const score = scoreHeaderSectionMatch(path, section, items);
    if (score > bestScore) {
      bestScore = score;
      bestSlug = section.slug;
    }
  }

  return bestSlug;
}
