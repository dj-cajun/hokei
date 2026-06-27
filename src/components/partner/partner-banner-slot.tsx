import { PartnerBannerImage } from "@/components/partner/partner-banner-image";
import { PartnerBannerLink } from "@/components/partner/partner-banner-link";
import type { PartnerBannerSlot as BannerSlot } from "@/generated/prisma/client";
import type { PartnerBannerWithStore } from "@/lib/partner/queries";
import { listBannersForSlot } from "@/lib/partner/queries";
import { isDatabaseAvailable } from "@/lib/database-available";
import { cn } from "@/lib/utils";

type PartnerBannerSlotProps = {
  slot: BannerSlot;
  /** 홈 등에서 선조회한 배너 — DB 재조회 생략 */
  banners?: PartnerBannerWithStore[];
  limit?: number;
  className?: string;
  imageClassName?: string;
  /** 세로 포스터 등 — 잘리지 않게 전체 노출 */
  fit?: "cover" | "contain";
};

export async function PartnerBannerSlot({
  slot,
  banners: preloaded,
  limit = 3,
  className = "space-y-2 px-3 py-2",
  imageClassName = "aspect-[3/1] w-full object-cover",
  fit = "cover",
}: PartnerBannerSlotProps) {
  if (!isDatabaseAvailable()) return null;

  const banners = preloaded ?? (await listBannersForSlot(slot, limit));
  if (banners.length === 0) return null;

  const useAspectCover = fit === "cover" && imageClassName.includes("aspect-");

  return (
    <div className={className}>
      {banners.map((banner) => {
        const slug = banner.linkSlug?.trim() || banner.store.slug;
        const alt = banner.altText ?? banner.store.name;
        return (
          <PartnerBannerLink
            key={banner.id}
            href={`/store/${slug}`}
            slug={slug}
            className={cn(
              "relative block overflow-hidden rounded-xl border border-border-light bg-surface shadow-sm",
              fit === "contain" && "bg-[#ebe6dc]",
              useAspectCover && "aspect-[3/1] w-full"
            )}
          >
            <PartnerBannerImage
              src={banner.imageUrl}
              alt={alt}
              fit={fit}
              sizes="(max-width: 1024px) 100vw, 480px"
              className={!useAspectCover ? imageClassName : undefined}
            />
          </PartnerBannerLink>
        );
      })}
    </div>
  );
}
