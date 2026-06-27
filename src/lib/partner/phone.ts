/** tel: 링크용 — 공백·하이픈 제거, + 유지 */
export function toTelHref(phone: string): string {
  const normalized = phone.trim().replace(/[^\d+]/g, "");
  return normalized ? `tel:${normalized}` : "";
}
