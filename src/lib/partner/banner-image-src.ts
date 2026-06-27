const SAME_SITE_HOSTS = new Set(["www.hokei.vn", "hokei.vn", "localhost"]);

/** next/image — 자사 절대 URL은 /public 상대 경로로 (remotePatterns 불필요) */
export function normalizePartnerBannerImageSrc(src: string): string {
  const trimmed = src.trim();
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (SAME_SITE_HOSTS.has(url.hostname)) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    /* keep original */
  }
  return trimmed;
}
