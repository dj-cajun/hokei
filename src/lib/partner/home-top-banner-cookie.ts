export const HOME_TOP_BANNER_DISMISS_PREFIX = "hokei_htb_";
export const HOME_TOP_BANNER_DISMISS_MAX_AGE_SEC = 60 * 60 * 24;

export function homeTopBannerDismissCookie(bannerId: string): string {
  return `${HOME_TOP_BANNER_DISMISS_PREFIX}${bannerId}`;
}

export function homeTopBannerDismissCookieHeader(
  bannerId: string
): string {
  const name = homeTopBannerDismissCookie(bannerId);
  return `${name}=1; Max-Age=${HOME_TOP_BANNER_DISMISS_MAX_AGE_SEC}; Path=/; SameSite=Lax`;
}
