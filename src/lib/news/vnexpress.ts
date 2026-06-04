/**
 * VnExpress 한국어 수집 전략
 *
 * 공식 한국어 RSS는 없습니다 (vnexpress.net = 베트남어, e.vnexpress.net = 영어).
 * 1) 네이버 뉴스 검색으로 VnExpress 관련 한국어 기사
 * 2) VnExpress International 영문 RSS → Gemini/Z.AI 한국어 변환
 */

export function isVnExpressSource(url: string, sourceName?: string): boolean {
  if (/vnexpress\.net/i.test(url)) return true;
  if (sourceName && /vnexpress|익스프레스/i.test(sourceName)) return true;
  return false;
}

export function isVnExpressArticle(
  url: string,
  title: string,
  sourceName: string
): boolean {
  if (url && /vnexpress\.net/i.test(url)) return true;
  if (/vnexpress|베트남\s*익스프레스|VnExpress/i.test(title)) return true;

  const linkPointsElsewhere =
    url.startsWith("http") && !/vnexpress\.net/i.test(url);

  // 피드 sourceName만 VnExpress인 네이버 검색 결과(조선·연합 등)는 제외
  if (!linkPointsElsewhere && /vnexpress|익스프레스/i.test(sourceName)) {
    return true;
  }

  return false;
}

/** 제목 앞 `VnExpress ·` 접두사 제거 */
export function stripVnExpressTitlePrefix(title: string): string {
  return title.replace(/^VnExpress\s*·\s*/iu, "").trim();
}
