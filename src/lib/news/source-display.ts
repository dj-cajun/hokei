/** 수집·DB용 — (스크래핑)·네이버·VnExpress 조합 라벨 제거 */

const SCRAPE_TAG = /\s*\(스크래핑\)\s*/gi;

const FEED_AGGREGATOR =
  /^(네이버(\s*뉴스)?(\s*[·\/|.]\s*)?(VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)?|VnExpress|vnexpress|베트남\s*익스프레스|비나익스프레스)$/i;

export function sanitizeStoredSourceName(
  name?: string | null
): string | null {
  if (!name?.trim()) return null;
  let s = name.replace(SCRAPE_TAG, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^네이버\s*([·\/|.]\s*)?/i, "").trim();
  if (!s || FEED_AGGREGATOR.test(s)) return null;
  return s;
}

/** 기사 상단(썸네일 아래) — 수집용 매체명은 표시하지 않음 */
export function formatPostSourceLabel(
  name?: string | null
): string | null {
  return sanitizeStoredSourceName(name);
}
