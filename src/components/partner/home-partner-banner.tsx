import { PartnerBannerSlot } from "@/components/partner/partner-banner-slot";
import type { PartnerBannerWithStore } from "@/lib/partner/queries";

type HomePartnerBannerProps = {
  banners?: PartnerBannerWithStore[];
};

export async function HomePartnerBanner({ banners }: HomePartnerBannerProps = {}) {
  return <PartnerBannerSlot slot="HOME_BOTTOM" banners={banners} />;
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
