import Image from "next/image";
import Link from "next/link";
import { BLUR_DATA_URL } from "@/components/ui/image-lightbox";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";
import type { PartnerCategory } from "@/generated/prisma/client";

export type PartnerCardData = {
  slug: string;
  name: string;
  tagline?: string | null;
  category: PartnerCategory;
  thumbnail?: string | null;
};

type PartnerCardProps = {
  store: PartnerCardData;
};

export function PartnerCard({ store }: PartnerCardProps) {
  const href = `/store/${store.slug}`;
  const categoryLabel = PARTNER_CATEGORY_LABELS[store.category];

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl border border-border-light bg-surface transition-colors hover:bg-card-hover"
    >
      <div className="relative aspect-[16/10] w-full bg-muted">
        {store.thumbnail?.trim() ? (
          <Image
            src={store.thumbnail.trim()}
            alt=""
            fill
            sizes="(max-width: 480px) 50vw, 200px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-2xl font-bold text-primary/30">
              {store.name.slice(0, 1)}
            </span>
          </div>
        )}
      </div>
      <div className="p-3">
        <span className="text-[10px] font-medium text-muted-foreground">
          {categoryLabel}
        </span>
        <p className="mt-0.5 line-clamp-1 text-sm font-semibold">{store.name}</p>
        {store.tagline?.trim() && (
          <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
            {store.tagline}
          </p>
        )}
      </div>
    </Link>
  );
}
