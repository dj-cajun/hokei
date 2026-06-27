export const PARTNER_SLUG_MIN = 2;
export const PARTNER_SLUG_MAX = 48;

/** 클라이언트·서버 공용 — ASCII kebab slug (한글 등은 제거) */
export function slugifyPartnerNameAscii(name: string): string {
  const ascii = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, PARTNER_SLUG_MAX);

  return ascii.length >= PARTNER_SLUG_MIN ? ascii : "store";
}
