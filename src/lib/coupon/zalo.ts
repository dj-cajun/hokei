/** Zalo 인앱 브라우저 · 공유 링크 */

export function isZaloInAppBrowser(userAgent: string): boolean {
  return /\bzalo\b/i.test(userAgent) || /\bzalopay\b/i.test(userAgent);
}

export function zaloShareUrl(pageUrl: string): string {
  return `https://button-share.zalo.me/share?url=${encodeURIComponent(pageUrl)}`;
}

export function couponPageUrl(siteUrl: string, slug: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/store/${slug}/coupon`;
}
