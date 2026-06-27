import Link from "next/link";
import Image from "next/image";
import { listBannersForSlot } from "@/lib/partner/queries";
import { isDatabaseAvailable } from "@/lib/database-available";

type HomePartnerBannerProps = {
  className?: string;
};

export async function HomePartnerBanner({ className }: HomePartnerBannerProps) {
  if (!isDatabaseAvailable()) return null;

  const banners = await listBannersForSlot("HOME_BOTTOM");
  const banner = banners[0];
  if (!banner) return null;

  const slug = banner.linkSlug?.trim() || banner.store.slug;
  const href = `/store/${slug}`;
  const alt = banner.altText?.trim() || banner.store.name;

  return (
    <section className={className} aria-label="제휴 업소 배너">
      <Link
        href={href}
        className="mx-3 block overflow-hidden rounded-xl border border-border-light bg-surface"
      >
        <div className="relative aspect-[3/1] w-full bg-muted">
          <Image
            src={banner.imageUrl}
            alt={alt}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
          />
        </div>
        <p className="px-2 py-1.5 text-center text-[10px] text-muted-foreground">
          호케이 제휴 · {banner.store.name}
        </p>
      </Link>
    </section>
  );
}
