export const PARTNER_VIEW_COOKIE_PREFIX = "hokei_pev_";
export const PARTNER_CLICK_COOKIE_PREFIX = "hokei_pec_";
export const PARTNER_VIEW_COOKIE_MAX_AGE_SEC = 60 * 60 * 24;
/** 배너 클릭 — 1시간 내 동일 업소 중복 기록 방지 */
export const PARTNER_CLICK_COOKIE_MAX_AGE_SEC = 60 * 60;

export function partnerViewCookieName(storeId: string): string {
  return `${PARTNER_VIEW_COOKIE_PREFIX}${storeId}`;
}

export function partnerClickCookieName(storeId: string): string {
  return `${PARTNER_CLICK_COOKIE_PREFIX}${storeId}`;
}

function hasPartnerEventCookie(
  request: Request,
  cookieName: string
): boolean {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return false;
  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|;\\s*)${escaped}=1(?:;|$)`).test(cookieHeader);
}

export function hasPartnerViewCookie(request: Request, storeId: string): boolean {
  return hasPartnerEventCookie(request, partnerViewCookieName(storeId));
}

export function hasPartnerClickCookie(request: Request, storeId: string): boolean {
  return hasPartnerEventCookie(request, partnerClickCookieName(storeId));
}
