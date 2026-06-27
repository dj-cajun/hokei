export const PARTNER_VIEW_COOKIE_PREFIX = "hokei_pev_";
export const PARTNER_VIEW_COOKIE_MAX_AGE_SEC = 60 * 60 * 24;

export function partnerViewCookieName(storeId: string): string {
  return `${PARTNER_VIEW_COOKIE_PREFIX}${storeId}`;
}

export function hasPartnerViewCookie(request: Request, storeId: string): boolean {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return false;
  const name = partnerViewCookieName(storeId);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|;\\s*)${escaped}=1(?:;|$)`).test(cookieHeader);
}
