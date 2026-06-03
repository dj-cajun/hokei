/** 자동 뉴스 본문 최소 길이 — ingest·article-body·정리 스크립트 공통 */
export const NEWS_MIN_BODY_LENGTH = 80;

export function hasSubstantialNewsBody(
  content: string | null | undefined
): boolean {
  const text = (content ?? "").replace(/\s+/g, " ").trim();
  return text.length >= NEWS_MIN_BODY_LENGTH;
}
