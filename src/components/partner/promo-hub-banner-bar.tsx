import Link from "next/link";
import {
  LIFE_INFO_HUB_CELL_CLASS,
  LifeInfoHubStrip,
} from "@/components/category/life-info-hub-box";
import { PartnerBannerImage } from "@/components/partner/partner-banner-image";
import { PartnerBannerLink } from "@/components/partner/partner-banner-link";
import type { PremiumPartnerNameItem } from "@/components/partner/premium-partner-name-grid";
import type { PartnerBannerWithStore } from "@/lib/partner/queries";
import { listBannersForSlot } from "@/lib/partner/queries";
import { isDatabaseAvailable } from "@/lib/database-available";
import { cn } from "@/lib/utils";

const SLOT_COUNT = 4;

type PromoHubBannerBarProps = {
  premiumStores: PremiumPartnerNameItem[];
};

type BannerBarSlot =
  | { kind: "premium"; store: PremiumPartnerNameItem }
  | { kind: "banner"; banner: PartnerBannerWithStore }
  | { kind: "empty" };

function buildBannerBarSlots(
  premiumStores: PremiumPartnerNameItem[],
  banners: PartnerBannerWithStore[]
): BannerBarSlot[] {
  const premiumSlots = premiumStores.slice(0, SLOT_COUNT);
  const bannerSlots = banners.slice(0, SLOT_COUNT - premiumSlots.length);
  const slots: BannerBarSlot[] = [
    ...premiumSlots.map((store) => ({ kind: "premium" as const, store })),
    ...bannerSlots.map((banner) => ({ kind: "banner" as const, banner })),
  ];
  while (slots.length < SLOT_COUNT) {
    slots.push({ kind: "empty" });
  }
  return slots.slice(0, SLOT_COUNT);
}

/** 찐 생활정보 — 4칸 동일 크기 배너바 */
export async function PromoHubBannerBar({
  premiumStores,
}: PromoHubBannerBarProps) {
  const banners =
    isDatabaseAvailable() ? await listBannersForSlot("PROMO_TOP", SLOT_COUNT) : [];

  const slots = buildBannerBarSlots(premiumStores, banners);
  const hasContent = slots.some((slot) => slot.kind !== "empty");
  if (!hasContent) return null;

  return (
    <LifeInfoHubStrip>
      <div
        className="grid h-full w-full min-h-0 grid-cols-4 gap-1.5 sm:gap-2"
        role="list"
        aria-label="제휴 배너"
      >
        {slots.map((slot, index) => {
          if (slot.kind === "premium") {
            return (
              <Link
                key={slot.store.id}
                href="/partners/premium"
                role="listitem"
                className={cn(
                  LIFE_INFO_HUB_CELL_CLASS,
                  "group border-amber-400/80 bg-transparent",
                  "dark:border-amber-500/40",
                  "transition-colors hover:border-amber-500"
                )}
              >
                <span className="line-clamp-2 px-1 text-center text-[11px] font-bold leading-snug text-foreground group-hover:text-primary sm:text-xs">
                  {slot.store.name}
                </span>
              </Link>
            );
          }

          if (slot.kind === "banner") {
            const slug =
              slot.banner.linkSlug?.trim() || slot.banner.store.slug;
            const alt = slot.banner.altText ?? slot.banner.store.name;
            return (
              <PartnerBannerLink
                key={slot.banner.id}
                href={`/store/${slug}`}
                slug={slug}
                className={cn(
                  LIFE_INFO_HUB_CELL_CLASS,
                  "bg-[#ebe6dc] transition-opacity hover:opacity-95 dark:bg-transparent"
                )}
              >
                <PartnerBannerImage
                  src={slot.banner.imageUrl}
                  alt={alt}
                  fit="contain"
                  sizes="(max-width: 1024px) 25vw, 120px"
                />
              </PartnerBannerLink>
            );
          }

          return (
            <div
              key={`empty-${index}`}
              role="listitem"
              aria-hidden
              className={cn(
                LIFE_INFO_HUB_CELL_CLASS,
                "border-dashed bg-muted/20 dark:border-border/60 dark:bg-transparent"
              )}
            />
          );
        })}
      </div>
    </LifeInfoHubStrip>
  );
}
