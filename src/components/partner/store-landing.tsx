import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import type { PartnerCategory } from "@/generated/prisma/client";
import { BLUR_DATA_URL } from "@/components/ui/image-lightbox";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";
import { StoreCtaBar } from "@/components/partner/store-cta-bar";

export type PartnerStoreLandingData = {
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  category: PartnerCategory;
  phone?: string | null;
  kakaoLink?: string | null;
  mapsUrl?: string | null;
  address?: string | null;
  hoursText?: string | null;
  thumbnail?: string | null;
};

type StoreLandingProps = {
  store: PartnerStoreLandingData;
};

export function StoreLanding({ store }: StoreLandingProps) {
  const categoryLabel = PARTNER_CATEGORY_LABELS[store.category];

  return (
    <article className="min-w-0 flex-1 bg-surface">
      {store.thumbnail?.trim() ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={store.thumbnail.trim()}
            alt={`${store.name} 썸네일`}
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </div>
      ) : (
        <div
          className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5"
          aria-hidden
        >
          <span className="text-4xl font-bold text-primary/30">
            {store.name.slice(0, 1)}
          </span>
        </div>
      )}

      <header className="border-b border-border-light px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
            {categoryLabel}
          </span>
        </div>
        <h1 className="mt-2 text-xl font-bold leading-tight">{store.name}</h1>
        {store.tagline?.trim() && (
          <p className="mt-1.5 text-sm text-muted-foreground">{store.tagline}</p>
        )}
      </header>

      <StoreCtaBar
        kakaoLink={store.kakaoLink}
        phone={store.phone}
        mapsUrl={store.mapsUrl}
      />

      <div className="space-y-4 px-4 py-5">
        {store.description?.trim() && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {store.description.trim()}
          </p>
        )}

        {store.hoursText?.trim() && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="whitespace-pre-wrap leading-relaxed">
              {store.hoursText.trim()}
            </p>
          </div>
        )}

        {store.address?.trim() && (
          <div className="flex gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="leading-relaxed">{store.address.trim()}</p>
          </div>
        )}
      </div>

      <footer className="border-t border-border-light px-4 py-4 text-center">
        <Link
          href="/partners"
          className="text-xs text-primary hover:underline"
        >
          호케이 제휴 업소 보기
        </Link>
      </footer>
    </article>
  );
}
