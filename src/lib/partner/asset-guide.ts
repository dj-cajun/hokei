/** 제휴 업소·배너 에셋 권장 사이즈 (운영·admin 가이드) */
export const PARTNER_ASSET_GUIDE = {
  lpThumbnail: {
    label: "LP 썸네일 (Hero)",
    size: "800×800 ~ 1200×900 (1:1~4:3)",
    format: "JPG/PNG/WebP",
    note: "가게 LP 상단. 세로형도 가능(object-contain).",
  },
  ogImage: {
    label: "SNS 공유 OG 이미지",
    size: "1200×630 권장 (최소 800×400, 비율 1.91:1)",
    format: "JPG/PNG",
    note: "카카오·Facebook·X 링크 미리보기. LP 썸네일과 별도 권장.",
  },
  homeTopPc: {
    label: "HOME_TOP PC (lg+)",
    size: "1200×88 ~ 1440×120 (가로형 스트립, 높이 ~88px 노출)",
    format: "JPG",
    note: "홈 최상단 전폭. object-cover.",
  },
  homeTopMobile: {
    label: "HOME_TOP 모바일 (<768px)",
    size: "1024×220 (비율 1024:220, max-height ~200px)",
    format: "PNG/JPG",
    note: "PC와 별도 파일 권장. object-contain.",
  },
  homeBottom: {
    label: "HOME_BOTTOM / NEWS_INLINE / PROMO_TOP",
    size: "1200×400 (3:1)",
    format: "JPG/PNG",
    note: "홈·게시판 중간 배너 슬롯.",
  },
} as const;

export type PartnerAssetGuideKey = keyof typeof PARTNER_ASSET_GUIDE;

export function partnerAssetGuideLine(key: PartnerAssetGuideKey): string {
  const g = PARTNER_ASSET_GUIDE[key];
  return `${g.label}: ${g.size} · ${g.format}. ${g.note}`;
}

/** admin 폼용 — 절대 URL 또는 siteUrl 기준 상대 경로 */
export function resolvePartnerMediaAbsoluteUrl(
  url: string | null | undefined,
  siteUrl: string
): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (/^https:\/\/.+/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) {
    return `${siteUrl.replace(/\/$/, "")}${trimmed}`;
  }
  return undefined;
}

/** SNS OG — ogImageUrl 우선, 없으면 thumbnail fallback */
export function resolvePartnerOgImageUrl(
  store: { ogImageUrl?: string | null; thumbnail?: string | null },
  siteUrl: string
): string | undefined {
  return (
    resolvePartnerMediaAbsoluteUrl(store.ogImageUrl, siteUrl) ??
    resolvePartnerMediaAbsoluteUrl(store.thumbnail, siteUrl)
  );
}
