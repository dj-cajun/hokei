import Link from "next/link";
import { isDatabaseAvailable } from "@/lib/database-available";
import { listBannersForSlot } from "@/lib/partner/queries";

export async function HomePartnerBanner() {
  if (!isDatabaseAvailable()) return null;

  const banners = await listBannersForSlot("HOME_BOTTOM", 3);
  if (banners.length === 0) return null;

  return (
    <div className="space-y-2 px-3 py-2">
      {banners.map((banner) => {
        const slug = banner.linkSlug?.trim() || banner.store.slug;
        return (
          <Link
            key={banner.id}
            href={`/store/${slug}`}
            className="block overflow-hidden rounded-xl border border-border-light bg-surface shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.imageUrl}
              alt={banner.altText ?? banner.store.name}
              className="aspect-[3/1] w-full object-cover"
            />
          </Link>
        );
      })}
    </div>
  );
}
