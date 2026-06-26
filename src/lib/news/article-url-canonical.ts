/** 수집·중복 제거용 기사 URL 정규화 */

const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "from",
] as const;

function stripTrackingParams(url: URL): void {
  for (const key of TRACKING_PARAMS) {
    url.searchParams.delete(key);
  }
  url.hash = "";
}

/** 동일 기사·다른 추적 파라미터·미러 URL 통합 */
export function canonicalNewsArticleUrl(url: string): string {
  try {
    const u = new URL(url);
    stripTrackingParams(u);

    const naver = u.pathname.match(/\/article\/(\d+)\/(\d+)/);
    if (/\.?naver\.com$/i.test(u.hostname.replace(/^www\./i, "")) && naver) {
      return `https://n.news.naver.com/mnews/article/${naver[1]}/${naver[2]}`;
    }

    const idxno = u.searchParams.get("idxno");
    if (idxno && /articleview\.html/i.test(u.pathname)) {
      u.search = `idxno=${idxno}`;
      return u.href;
    }

    if (/vnexpress\.net$/i.test(u.hostname.replace(/^www\./i, ""))) {
      const slug = u.pathname.replace(/\/+$/, "");
      return `https://${u.hostname.replace(/^www\./i, "")}${slug}`;
    }

    const sorted = new URL(u.href);
    stripTrackingParams(sorted);
    sorted.pathname = sorted.pathname.replace(/\/+$/, "") || "/";
    return sorted.href;
  } catch {
    return url;
  }
}
