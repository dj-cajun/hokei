/** 제휴 LP·배너 이미지 — Vercel Blob https 또는 /partners/ 정적 경로만 허용 */
export function isValidPartnerMediaUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^https:\/\/.+/i.test(v)) return true;
  if (!v.startsWith("/partners/")) return false;
  if (v.includes("..") || v.includes("\\")) return false;
  return true;
}

export function isValidOptionalPartnerMediaUrl(value: string): boolean {
  if (value === "") return true;
  return isValidPartnerMediaUrl(value);
}
