export const VIEW_COOKIE_PREFIX = "hokei_pv_";
export const VIEW_COOKIE_MAX_AGE_SEC = 60 * 60 * 24;

export function viewCookieName(postId: string): string {
  return `${VIEW_COOKIE_PREFIX}${postId}`;
}

/** Cookie 헤더 문자열에서 조회수 쿠키 존재 여부 */
export function hasViewCookieInHeader(cookieHeader: string | null, name: string): boolean {
  if (!cookieHeader) return false;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|;\\s*)${escaped}=1(?:;|$)`).test(cookieHeader);
}

export function hasViewCookie(request: Request, name: string): boolean {
  return hasViewCookieInHeader(request.headers.get("cookie"), name);
}
