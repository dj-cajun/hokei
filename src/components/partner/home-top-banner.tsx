import { HomeTopBannerDismiss } from "@/components/partner/home-top-banner-dismiss";
import { HomeTopBannerVisibility } from "@/components/partner/home-top-banner-visibility";
import { PartnerBannerLink } from "@/components/partner/partner-banner-link";
import { isDatabaseAvailable } from "@/lib/database-available";
import { listBannersForSlot } from "@/lib/partner/queries";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

/** stale Prisma 클라이언트가 mobileImageUrl을 안 읽을 때 DB 직접 조회 */
async function resolveMobileImageUrl(
  bannerId: string,
  fromModel: string | null | undefined,
  pcFallback: string
): Promise<string> {
  const trimmed = fromModel?.trim();
  if (trimmed) return trimmed;

  try {
    const rows = await prisma.$queryRaw<{ mobileImageUrl: string | null }[]>`
      SELECT "mobileImageUrl" FROM "PartnerBanner" WHERE "id" = ${bannerId} LIMIT 1
    `;
    const raw = rows[0]?.mobileImageUrl?.trim();
    if (raw) return raw;
  } catch {
    /* column 없거나 조회 실패 시 PC 이미지 */
  }

  return pcFallback;
}

/** 홈 최상단 — PC·모바일 배너 분리 (breakpoint: lg = 홈 레이아웃과 동일) */
export async function HomeTopBanner() {
  if (!isDatabaseAvailable()) return null;

  const banners = await listBannersForSlot("HOME_TOP", 1);
  const banner = banners[0];
  if (!banner) return null;

  const slug = banner.linkSlug?.trim() || banner.store.slug;
  const href = `/store/${slug}`;
  const alt = banner.altText ?? banner.store.name;
  const mobileSrc = await resolveMobileImageUrl(
    banner.id,
    banner.mobileImageUrl,
    banner.imageUrl
  );
  const hasDedicatedMobile = mobileSrc !== banner.imageUrl;

  return (
    <HomeTopBannerVisibility bannerId={banner.id}>
      <section
        className="relative w-full shrink-0 overflow-hidden bg-[#ebe6dc]"
        aria-label="제휴 상단 배너"
      >
        <PartnerBannerLink
          href={href}
          slug={slug}
          className={cn(
            "block w-full lg:hidden",
            hasDedicatedMobile ? "aspect-[1024/220] max-h-[200px]" : "h-[120px]"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mobileSrc}
            alt={alt}
            className="h-full w-full object-contain object-center"
          />
        </PartnerBannerLink>

        <PartnerBannerLink
          href={href}
          slug={slug}
          className="hidden h-[88px] w-full lg:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imageUrl}
            alt={alt}
            className="h-full w-full object-cover object-center"
          />
        </PartnerBannerLink>

        <HomeTopBannerDismiss />
      </section>
    </HomeTopBannerVisibility>
  );
}
