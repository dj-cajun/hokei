/** O2O 쿠폰 — 호케이 통합 설정 */

export const COUPON_API_URL =
  process.env.NEXT_PUBLIC_COUPON_API_URL ?? "http://localhost:3020";

/** 인프로세스 쿠폰 API 사용 여부 (env만 검사 — 클라이언트 번들 안전) */
export function useInProcessCouponApi(): boolean {
  if (process.env.COUPON_IN_PROCESS === "false") return false;
  const external = process.env.NEXT_PUBLIC_COUPON_API_URL?.trim();
  if (process.env.COUPON_IN_PROCESS === "true") return true;
  return !external;
}

export type CouponStoreEntry = {
  slug: string;
  agencyLoginId: string;
  label?: string;
};

/** 코드 SSOT — 신규 업소는 여기 + coupon-pilot seed */
const BASE_REGISTRY: CouponStoreEntry[] = [
  {
    slug: "2d-sketch-cafe",
    agencyLoginId: "2d_sketch_cafe",
    label: "2D SKETCH CAFE",
  },
  {
    slug: "demo-cafe",
    agencyLoginId: "other_cafe",
    label: "다른 카페 (테스트)",
  },
];

/** env 추가 매핑: `slug:agencyLoginId` 또는 `slug:agencyLoginId:표시명` (쉼표 구분) */
function parseEnvStoreMap(raw: string | undefined): CouponStoreEntry[] {
  if (!raw?.trim()) return [];
  const out: CouponStoreEntry[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [slug, agencyLoginId, label] = trimmed.split(":");
    if (!slug?.trim() || !agencyLoginId?.trim()) continue;
    out.push({
      slug: slug.trim(),
      agencyLoginId: agencyLoginId.trim(),
      label: label?.trim() || undefined,
    });
  }
  return out;
}

function buildRegistry(): CouponStoreEntry[] {
  const map = new Map<string, CouponStoreEntry>();
  for (const entry of BASE_REGISTRY) {
    map.set(entry.slug, entry);
  }
  for (const entry of parseEnvStoreMap(process.env.NEXT_PUBLIC_COUPON_STORE_MAP)) {
    map.set(entry.slug, entry);
  }
  return [...map.values()];
}

export const COUPON_STORE_REGISTRY = buildRegistry();

const enabledRaw =
  process.env.NEXT_PUBLIC_COUPON_ENABLED_SLUGS ?? "2d-sketch-cafe";

export const COUPON_ENABLED_SLUGS = new Set(
  enabledRaw.split(",").map((s) => s.trim()).filter(Boolean),
);

export function isCouponStore(slug: string): boolean {
  return COUPON_ENABLED_SLUGS.has(slug) && !!agencyLoginIdForStore(slug);
}

export function storeCouponBase(slug: string): string {
  return `/store/${slug}/coupon`;
}

export function agencyLoginIdForStore(slug: string): string | undefined {
  return COUPON_STORE_REGISTRY.find((s) => s.slug === slug)?.agencyLoginId;
}

export function storeSlugForAgencyLoginId(loginId: string): string | undefined {
  return COUPON_STORE_REGISTRY.find((s) => s.agencyLoginId === loginId)?.slug;
}

export function couponStoreLabel(slug: string): string | undefined {
  return COUPON_STORE_REGISTRY.find((s) => s.slug === slug)?.label;
}

/** 활성화된 업소만 (env whitelist ∩ registry) */
export function listEnabledCouponStores(): CouponStoreEntry[] {
  return COUPON_STORE_REGISTRY.filter((s) => COUPON_ENABLED_SLUGS.has(s.slug));
}

export const PARTNER_COUPON_BASE = "/account/partner/coupon";

export const AGENCY_TOKEN_KEY = "hokei_agency_token";
export const STAFF_TOKEN_KEY = "hokei_staff_token";
