/** 본문이 이미 한국어(네이버 뉴스 등)인지 간단 판별 */
export function isMostlyKorean(text: string): boolean {
  const hangul = (text.match(/[\uAC00-\uD7A3]/g) ?? []).length;
  const letters = (text.match(/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\uAC00-\uD7A3]/g) ?? [])
    .length;
  if (letters === 0) return hangul > 0;
  return hangul / letters >= 0.35;
}
