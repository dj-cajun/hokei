import { PartnerBannerSlot } from "@/components/partner/partner-banner-slot";

export async function HomePartnerBanner() {
  return <PartnerBannerSlot slot="HOME_BOTTOM" />;
}

export async function HomePartnerBannerTop() {
  return (
    <PartnerBannerSlot
      slot="HOME_TOP"
      limit={1}
      className="px-3 pt-2"
      imageClassName="aspect-[3/1] w-full rounded-xl object-cover shadow-md ring-1 ring-black/5"
    />
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
