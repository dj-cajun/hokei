import { PartnerBannerImage } from "@/components/partner/partner-banner-image";
import { PartnerBannerLink } from "@/components/partner/partner-banner-link";
import type { PartnerBannerWithStore } from "@/lib/partner/queries";
import { listBannersForSlotCached } from "@/lib/partner/queries";
import { isDatabaseAvailable } from "@/lib/database-available";
import { cn } from "@/lib/utils";

function resolveMobileImageUrl(
  mobileImageUrl: string | null | undefined,
  pcFallback: string
): string {
  const trimmed = mobileImageUrl?.trim();
  return trimmed || pcFallback;
}

type HomeTopBannerViewProps = {
  banner: PartnerBannerWithStore | null | undefined;
};

/** 홈 최상단 — PC·모바일 배너 분리 (breakpoint: lg) */
export function HomeTopBannerView({ banner }: HomeTopBannerViewProps) {
  if (!banner) return null;

  const slug = banner.linkSlug?.trim() || banner.store.slug;
  const href = `/store/${slug}`;
  const alt = banner.altText ?? banner.store.name;
  const mobileSrc = resolveMobileImageUrl(banner.mobileImageUrl, banner.imageUrl);
  const hasDedicatedMobile = mobileSrc !== banner.imageUrl;

  return (
    <section
      className="relative w-full shrink-0 overflow-hidden bg-[#ebe6dc]"
      aria-label="제휴 상단 배너"
    >
      <PartnerBannerLink
        href={href}
        slug={slug}
        className={cn(
          "relative block w-full lg:hidden",
          hasDedicatedMobile ? "aspect-[1024/220] max-h-[200px]" : "h-[120px]"
        )}
      >
        <PartnerBannerImage
          src={mobileSrc}
          alt={alt}
          priority
          fit="contain"
          sizes="100vw"
        />
      </PartnerBannerLink>

      <PartnerBannerLink
        href={href}
        slug={slug}
        className="relative hidden h-[88px] w-full lg:block"
      >
        <PartnerBannerImage
          src={banner.imageUrl}
          alt={alt}
          priority
          fit="cover"
          sizes="100vw"
        />
      </PartnerBannerLink>
    </section>
  );
}

/** 단독 사용 시 — 요청 내 react/cache로 1회 조회 */
export async function HomeTopBanner() {
  if (!isDatabaseAvailable()) return null;
  const banners = await listBannersForSlotCached("HOME_TOP", 1);
  return <HomeTopBannerView banner={banners[0]} />;
}
