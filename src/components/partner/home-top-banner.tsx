import { PartnerStripBannerView } from "@/components/partner/partner-strip-banner-view";
import type { PartnerBannerWithStore } from "@/lib/partner/queries";
import { listBannersForSlotCached } from "@/lib/partner/queries";
import { isDatabaseAvailable } from "@/lib/database-available";

type HomeTopBannerViewProps = {
  banner: PartnerBannerWithStore | null | undefined;
};

/** 홈 최상단 — PC·모바일 배너 분리 (breakpoint: lg) */
export function HomeTopBannerView({ banner }: HomeTopBannerViewProps) {
  if (!banner) return null;

  return (
    <section aria-label="제휴 상단 배너">
      <PartnerStripBannerView banner={banner} priority />
    </section>
  );
}

/** 단독 사용 시 — 요청 내 react/cache로 1회 조회 */
export async function HomeTopBanner() {
  if (!isDatabaseAvailable()) return null;
  const banners = await listBannersForSlotCached("HOME_TOP", 1);
  return <HomeTopBannerView banner={banners[0]} />;
}
