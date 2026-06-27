import Link from "next/link";
import type { PartnerStore } from "@/generated/prisma/client";
import { StoreCtaBar } from "@/components/partner/store-cta-bar";
import { StoreViewTracker } from "@/components/partner/store-view-tracker";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";

type StoreLandingProps = {
  store: PartnerStore;
  isPreview?: boolean;
  promoTimelineSlug?: string | null;
};

export function StoreLanding({
  store,
  isPreview = false,
  promoTimelineSlug = null,
}: StoreLandingProps) {
  const categoryLabel = PARTNER_CATEGORY_LABELS[store.category];

  return (
    <div className="mx-auto w-full max-w-[480px] flex-1 bg-surface lg:max-w-2xl lg:rounded-lg">
      {!isPreview ? <StoreViewTracker slug={store.slug} /> : null}

      {isPreview ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
          관리자 미리보기 — {store.status === "PUBLISHED" ? "공개 상태" : "비공개(draft)"}
        </div>
      ) : null}

      {store.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.thumbnail}
          alt=""
          className="aspect-[16/10] w-full object-cover"
          fetchPriority="high"
        />
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-secondary text-sm text-muted-foreground">
          {store.name}
        </div>
      )}

      <header className="border-b border-border-light px-4 py-4">
        <p className="text-[11px] font-medium text-primary">{categoryLabel}</p>
        <h1 className="mt-1 text-xl font-bold leading-snug">{store.name}</h1>
        {store.tagline ? (
          <p className="mt-2 text-sm text-muted-foreground">{store.tagline}</p>
        ) : null}
        {promoTimelineSlug ? (
          <Link
            href={`/promo/timeline/${promoTimelineSlug}`}
            className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
          >
            홍보·전단 아카이브 보기 →
          </Link>
        ) : null}
      </header>

      <StoreCtaBar
        slug={store.slug}
        kakaoLink={store.kakaoLink}
        phone={store.phone}
        mapsUrl={store.mapsUrl}
      />

      <div className="space-y-4 px-4 py-4 pb-8">
        {store.description ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              소개
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {store.description}
            </p>
          </section>
        ) : null}

        {store.hoursText ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              영업시간
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              🕐 {store.hoursText}
            </p>
          </section>
        ) : null}

        {store.address ? (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              주소
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              📍 {store.address}
            </p>
          </section>
        ) : null}
      </div>

      <footer className="border-t border-border-light px-4 py-4 text-center">
        <p className="text-[11px] text-muted-foreground">호케이 제휴 업소</p>
        <Link
          href="/partners"
          className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
        >
          제휴 업소 더 보기 →
        </Link>
      </footer>
    </div>
  );
}
