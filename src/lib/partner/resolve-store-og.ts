import { resolvePartnerMediaAbsoluteUrl } from "@/lib/partner/asset-guide";
import { getActivePartnerBannerForStore } from "@/lib/partner/queries";

export type StoreOgImageResolution = {
  url: string;
  /** 동적 이름 카드 (`/store/[slug]/opengraph-image`) */
  isGenerated: boolean;
};

/** SNS OG — 모바일 배너 우선, 없으면 PC imageUrl */
export function resolvePartnerBannerOgImageUrl(
  banner: { imageUrl: string; mobileImageUrl?: string | null },
  siteUrl: string
): string | undefined {
  return (
    resolvePartnerMediaAbsoluteUrl(banner.mobileImageUrl, siteUrl) ??
    resolvePartnerMediaAbsoluteUrl(banner.imageUrl, siteUrl)
  );
}

/** 배너 광고 업소 → 모바일 배너 이미지, 그 외 → 이름 카드 OG URL */
export async function resolveStoreOgImage(
  store: { id: string; slug: string },
  siteUrl: string
): Promise<StoreOgImageResolution> {
  const banner = await getActivePartnerBannerForStore(store.id);
  const bannerUrl = banner ? resolvePartnerBannerOgImageUrl(banner, siteUrl) : undefined;

  if (bannerUrl) {
    return { url: bannerUrl, isGenerated: false };
  }

  const base = siteUrl.replace(/\/$/, "");
  return {
    url: `${base}/store/${encodeURIComponent(store.slug)}/opengraph-image`,
    isGenerated: true,
  };
}
