import type { CurateKakaoContentType } from "@/lib/ai/curate-kakao-types";

/** AI 분류 → DB 하위 카테고리 slug (기본값) */
export const DEFAULT_CURATE_CATEGORY_SLUG: Record<
  Exclude<CurateKakaoContentType, "VIETNAMESE_STUDY" | "UNKNOWN">,
  string
> = {
  REAL_ESTATE: "real-estate-tenant-seeking",
  CLASSIFIED: "classifieds-selling",
  JOBS: "jobs-hiring",
  PROMO: "promo-store-hungry",
};

/** AI가 제안할 수 있는 하위 카테고리 후보 */
export const CURATE_CATEGORY_OPTIONS: Record<
  Exclude<CurateKakaoContentType, "VIETNAMESE_STUDY" | "UNKNOWN">,
  string[]
> = {
  REAL_ESTATE: [
    "real-estate-tenant-seeking",
    "real-estate-landlord-seeking",
  ],
  CLASSIFIED: ["classifieds-buying", "classifieds-selling"],
  JOBS: ["jobs-hiring", "jobs-job-seeking"],
  PROMO: ["promo-store-hungry", "promo-store-inconvenient"],
};

export function resolveCurateCategorySlug(
  contentType: CurateKakaoContentType,
  suggested?: string | null
): string | null {
  if (contentType === "VIETNAMESE_STUDY" || contentType === "UNKNOWN") {
    return null;
  }
  const options = CURATE_CATEGORY_OPTIONS[contentType];
  if (suggested && options.includes(suggested)) return suggested;
  return DEFAULT_CURATE_CATEGORY_SLUG[contentType];
}

export const POST_CURATE_TYPES: CurateKakaoContentType[] = [
  "REAL_ESTATE",
  "CLASSIFIED",
  "JOBS",
  "PROMO",
];
