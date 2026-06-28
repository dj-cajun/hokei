/** 카톡 CSV/원문 시스템 메시지 — ingest 전 제외 */
export function shouldSkipKakaoSystemMessage(
  user: string,
  message: string
): boolean {
  const cleaned = message.trim();
  const u = user.trim();
  if (u === "오픈채팅봇") return true;
  if (u === "." || u === "..") return true;
  if (cleaned.includes("님이 들어왔습니다")) return true;
  if (cleaned.includes("님이 나갔습니다")) return true;
  if (/^메시지(?:를)?\s*삭제/.test(cleaned)) return true;
  if (
    /사칭에 유의해 주세요/.test(cleaned) &&
    /님이 들어왔습니다|운영정책/.test(cleaned)
  ) {
    return true;
  }
  return false;
}

/** 매크로 dedupe용 본문 정규화 */
export function normalizeRawBodyForHash(body: string): string {
  return body.trim().replace(/\s+/g, " ");
}
