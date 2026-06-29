/** O2O 쿠폰 — 호케이 통합 설정 */

export const COUPON_API_URL =
  process.env.NEXT_PUBLIC_COUPON_API_URL ?? "http://localhost:3020";

const enabledRaw =
  process.env.NEXT_PUBLIC_COUPON_ENABLED_SLUGS ?? "2d-sketch-cafe";

export const COUPON_ENABLED_SLUGS = new Set(
  enabledRaw.split(",").map((s) => s.trim()).filter(Boolean),
);

export function isCouponStore(slug: string): boolean {
  return COUPON_ENABLED_SLUGS.has(slug);
}

export function storeCouponBase(slug: string): string {
  return `/store/${slug}/coupon`;
}

/** 호케이 PartnerStore.slug → coupon Agency.loginId */
const STORE_AGENCY_LOGIN_IDS: Record<string, string> = {
  "2d-sketch-cafe": "2d_sketch_cafe",
};

export function agencyLoginIdForStore(slug: string): string | undefined {
  return STORE_AGENCY_LOGIN_IDS[slug];
}

export function storeSlugForAgencyLoginId(loginId: string): string | undefined {
  for (const [slug, id] of Object.entries(STORE_AGENCY_LOGIN_IDS)) {
    if (id === loginId) return slug;
  }
  return undefined;
}

export const PARTNER_COUPON_BASE = "/account/partner/coupon";

export const AGENCY_TOKEN_KEY = "hokei_agency_token";
