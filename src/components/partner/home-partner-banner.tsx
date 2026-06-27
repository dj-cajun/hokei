import { PartnerBannerSlot } from "@/components/partner/partner-banner-slot";
import { PartnerStripBannerView } from "@/components/partner/partner-strip-banner-view";
import type { PartnerBannerWithStore } from "@/lib/partner/queries";
import { listBannersForSlot } from "@/lib/partner/queries";
import { isDatabaseAvailable } from "@/lib/database-available";

type HomePartnerBannerProps = {
  banners?: PartnerBannerWithStore[];
  className?: string;
};

/** 홈 중간 — 상단과 동일 스트립 배너 (PC·MO 분리) */
export async function HomePartnerBanner({
  banners,
  className = "",
}: HomePartnerBannerProps = {}) {
  if (!isDatabaseAvailable()) return null;

  const items = banners ?? (await listBannersForSlot("HOME_BOTTOM", 3));
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {items.map((banner) => (
        <PartnerStripBannerView key={banner.id} banner={banner} />
      ))}
    </div>
  );
}

export async function NewsPartnerBanner() {
  return (
    <PartnerBannerSlot
      slot="NEWS_INLINE"
      limit={1}
      className="px-2 py-2"
      imageClassName="aspect-[3/1] w-full rounded-lg object-cover"
    />
  );
}

export async function PromoPartnerBanner() {
  return (
    <PartnerBannerSlot
      slot="PROMO_TOP"
      limit={2}
      className="space-y-2 px-2 py-2"
      imageClassName="aspect-[3/1] w-full rounded-lg object-cover"
    />
  );
}
