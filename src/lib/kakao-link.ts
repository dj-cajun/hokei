const KAKAO_LINK_RE =
  /^https?:\/\/(pf\.kakao\.com\/[^/]+\/chat|open\.kakao\.com\/o\/[a-zA-Z0-9]+)/i;

/** 카카오톡 채널·오픈채팅 딥링크 검증 */
export function isValidKakaoLink(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return KAKAO_LINK_RE.test(trimmed);
  } catch {
    return false;
  }
}

export function normalizeKakaoLink(url: string): string {
  const trimmed = url.trim();
  if (!isValidKakaoLink(trimmed)) {
    throw new Error("유효한 카카오톡 링크가 아닙니다. (pf.kakao.com/…/chat 또는 open.kakao.com/o/…)");
  }
  return trimmed;
}
