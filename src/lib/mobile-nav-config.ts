import { LIFE_INFO_HUB_HREF } from "@/lib/life-info-hub";
import { isLifeInfoPath } from "@/lib/site-navigation";

/** 하단 탭 — 섹션 전체 글 목록 */
export const MOBILE_LIFE_INFO_LIST_HREF = LIFE_INFO_HUB_HREF;
export const MOBILE_COMMUNITY_LIST_HREF = "/community";

/** 모바일 하단 네비 — 서버·클라이언트 공통 설정 (하이드레이션 일치) */
export const MOBILE_NAV_ITEMS = [
  { href: "/", label: "홈", icon: "Home" },
  { href: "/news", label: "뉴스", icon: "Newspaper" },
  { href: "/life", label: "생활", icon: "BookOpen" },
  { href: MOBILE_LIFE_INFO_LIST_HREF, label: "업체", icon: "Flame" },
  { href: MOBILE_COMMUNITY_LIST_HREF, label: "소통", icon: "MessageCircle" },
  { href: "/profile", label: "내 정보", icon: "User" },
] as const;

/** 하단 탭 활성 여부 — 각 섹션 전체 목록 경로 기준 */
export function isMobileNavItemActive(
  item: MobileNavItemConfig,
  pathname: string
): boolean {
  if (item.href === "/") return pathname === "/";
  if (item.href === "/life") {
    return pathname === "/life" || pathname.startsWith("/life/");
  }
  if (item.href === LIFE_INFO_HUB_HREF) {
    return isLifeInfoPath(pathname);
  }
  if (item.href === MOBILE_COMMUNITY_LIST_HREF) {
    return (
      pathname === MOBILE_COMMUNITY_LIST_HREF ||
      pathname.startsWith(`${MOBILE_COMMUNITY_LIST_HREF}/`)
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export type MobileNavItemConfig = (typeof MOBILE_NAV_ITEMS)[number];
