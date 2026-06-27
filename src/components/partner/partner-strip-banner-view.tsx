import { PartnerBannerImage } from "@/components/partner/partner-banner-image";
import { PartnerBannerLink } from "@/components/partner/partner-banner-link";
import type { PartnerBannerWithStore } from "@/lib/partner/queries";
import { cn } from "@/lib/utils";

function resolveMobileImageUrl(
  mobileImageUrl: string | null | undefined,
  pcFallback: string
): string {
  const trimmed = mobileImageUrl?.trim();
  return trimmed || pcFallback;
}

type PartnerStripBannerViewProps = {
  banner: PartnerBannerWithStore;
  /** LCP 우선 — 홈 최상단만 true */
  priority?: boolean;
  className?: string;
};

/** HOME_TOP·HOME_BOTTOM 공통 — PC·모바일 배너 분리 (breakpoint: lg) */
export function PartnerStripBannerView({
  banner,
  priority = false,
  className,
}: PartnerStripBannerViewProps) {
  const slug = banner.linkSlug?.trim() || banner.store.slug;
  const href = `/store/${slug}`;
  const alt = banner.altText ?? banner.store.name;
  const mobileSrc = resolveMobileImageUrl(banner.mobileImageUrl, banner.imageUrl);
  const hasDedicatedMobile = mobileSrc !== banner.imageUrl;

  return (
    <div
      className={cn(
        "relative w-full shrink-0 overflow-hidden bg-[#ebe6dc]",
        className
      )}
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
          priority={priority}
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
          priority={priority}
          fit="cover"
          sizes="100vw"
        />
      </PartnerBannerLink>
    </div>
  );
}
