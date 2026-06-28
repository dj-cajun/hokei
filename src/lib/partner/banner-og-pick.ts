import type { PartnerBannerSlot } from "@/generated/prisma/client";

/** OG 미리보기용 — 가로형 슬롯 우선 (HOME_TOP 스트립은 마지막) */
export const OG_BANNER_SLOT_PRIORITY: PartnerBannerSlot[] = [
  "HOME_BOTTOM",
  "NEWS_INLINE",
  "PROMO_TOP",
  "HOME_TOP",
];

export function pickPartnerBannerForOg<
  T extends { slot: PartnerBannerSlot; sortOrder: number; createdAt: Date },
>(banners: T[]): T | null {
  if (banners.length === 0) return null;

  for (const slot of OG_BANNER_SLOT_PRIORITY) {
    const matches = banners
      .filter((banner) => banner.slot === slot)
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          b.createdAt.getTime() - a.createdAt.getTime()
      );
    if (matches[0]) return matches[0];
  }

  return banners[0] ?? null;
}
