import type { PartnerBannerSlot as BannerSlot } from "@/generated/prisma/client";
import { isDatabaseAvailable } from "@/lib/database-available";
import { listBannersForSlot } from "@/lib/partner/queries";
import { PartnerBannerLink } from "@/components/partner/partner-banner-link";

type PartnerBannerSlotProps = {
  slot: BannerSlot;
  limit?: number;
  className?: string;
  imageClassName?: string;
};

export async function PartnerBannerSlot({
  slot,
  limit = 3,
  className = "space-y-2 px-3 py-2",
  imageClassName = "aspect-[3/1] w-full object-cover",
}: PartnerBannerSlotProps) {
  if (!isDatabaseAvailable()) return null;

  const banners = await listBannersForSlot(slot, limit);
  if (banners.length === 0) return null;

  return (
    <div className={className}>
      {banners.map((banner) => {
        const slug = banner.linkSlug?.trim() || banner.store.slug;
        return (
          <PartnerBannerLink
            key={banner.id}
            href={`/store/${slug}`}
            slug={slug}
            className="block overflow-hidden rounded-xl border border-border-light bg-surface shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.imageUrl}
              alt={banner.altText ?? banner.store.name}
              className={imageClassName}
            />
          </PartnerBannerLink>
        );
      })}
    </div>
  );
}
