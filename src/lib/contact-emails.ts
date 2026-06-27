/** 일반 운영·개인정보·오류 문의 */
export function getContactEmail(): string {
  return process.env.CONTACT_EMAIL?.trim() || "webmaster@hokei.vn";
}

/** 배너·제휴·광고 집행 문의 */
export function getAdContactEmail(): string {
  return process.env.AD_CONTACT_EMAIL?.trim() || "ads@hokei.vn";
}

/** 문의 폼 실제 수신함 — 설정 시 Gmail 등으로 직접 전달 (Resend→@hokei.vn 루프 방지) */
export function getContactInboxEmail(kind: "general" | "ads"): string {
  const direct = process.env.CONTACT_INBOX_EMAIL?.trim();
  if (direct) return direct;
  return kind === "ads" ? getAdContactEmail() : getContactEmail();
}
