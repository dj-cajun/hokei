import Link from "next/link";
import type { PartnerStore } from "@/generated/prisma/client";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";

export type PartnerCardStore = Pick<
  PartnerStore,
  "slug" | "name" | "tagline" | "category" | "thumbnail"
>;

type PartnerCardProps = {
  store: PartnerCardStore;
};

export function PartnerCard({ store }: PartnerCardProps) {
  const categoryLabel = PARTNER_CATEGORY_LABELS[store.category];

  return (
    <Link
      href={`/store/${store.slug}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border-light bg-surface transition-colors hover:border-primary/30 hover:bg-card-hover"
    >
      {store.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.thumbnail}
          alt=""
          className="aspect-[16/10] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-secondary text-xs text-muted-foreground">
          {store.name}
        </div>
      )}
      <div className="flex flex-1 flex-col px-3 py-3">
        <p className="text-[10px] font-medium text-primary">{categoryLabel}</p>
        <h2 className="mt-0.5 text-sm font-bold leading-snug">{store.name}</h2>
        {store.tagline ? (
          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
            {store.tagline}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
