/** 여기 어때 — 3단계 카테고리 (promo → store → hungry|inconvenient) */
export const HERE_HOW_HREF = "/promo/store";

export const HERE_HOW_MID_SLUG = "promo-store";

export const HERE_HOW_LEAF_SLUGS = [
  "promo-store-hungry",
  "promo-store-inconvenient",
] as const;

export function isHereHowPath(pathname: string): boolean {
  return (
    pathname === HERE_HOW_HREF ||
    pathname.startsWith(`${HERE_HOW_HREF}/`) ||
    pathname === "/promo/hungry" ||
    pathname.startsWith("/promo/hungry/") ||
    pathname === "/promo/inconvenient" ||
    pathname.startsWith("/promo/inconvenient/")
  );
}
