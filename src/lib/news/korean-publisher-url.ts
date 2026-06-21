/** 인사이드비나·Vietnam.vn·라오동신문 등 한국어판이 있는 현지 매체 */

const VIETNAM_VN_HOST = /(?:^|\.)vietnam\.vn$/i;
const INSIDEVINA_HOST = /insidevina\.com/i;
const LAODONG_KO_HOST = /^ko\.laodong\.vn$/i;
const LAODONG_HOST = /(?:^|\.)laodong\.vn$/i;

export function isVietnamVnHost(hostname: string): boolean {
  return VIETNAM_VN_HOST.test(hostname.replace(/^www\./i, ""));
}

export function isInsideVinaHost(hostname: string): boolean {
  return INSIDEVINA_HOST.test(hostname);
}

export function isLaodongKoHost(hostname: string): boolean {
  return LAODONG_KO_HOST.test(hostname.replace(/^www\./i, ""));
}

export function isLaodongHost(hostname: string): boolean {
  return LAODONG_HOST.test(hostname.replace(/^www\./i, ""));
}

/** 수집·본문 fetch 전 — Vietnam.vn은 /ko/ 경로로 통일 */
export function toKoreanPublisherArticleUrl(
  url: string,
  _sourceName?: string
): string {
  try {
    const u = new URL(url);
    if (isVietnamVnHost(u.hostname)) {
      if (!u.pathname.startsWith("/ko/")) {
        const rest = u.pathname === "/" ? "" : u.pathname;
        u.pathname = `/ko${rest.startsWith("/") ? rest : `/${rest}`}`;
      }
      return u.href;
    }
    if (isLaodongHost(u.hostname) && !isLaodongKoHost(u.hostname)) {
      u.hostname = "ko.laodong.vn";
      return u.href;
    }
  } catch {
    /* invalid url */
  }
  return url;
}

/** 한국어판만 수집 (Vietnam.vn /ko/, 인사이드비나·라오동 ko 전체) */
export function isKoreanPublisherArticleUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (isVietnamVnHost(u.hostname)) return u.pathname.startsWith("/ko/");
    if (isInsideVinaHost(u.hostname)) return true;
    if (isLaodongKoHost(u.hostname)) return true;
  } catch {
    return false;
  }
  return false;
}

export function shouldUseKoreanPublisherFeed(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      isVietnamVnHost(u.hostname) ||
      isInsideVinaHost(u.hostname) ||
      isLaodongKoHost(u.hostname)
    );
  } catch {
    return false;
  }
}
