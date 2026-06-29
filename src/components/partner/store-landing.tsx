import Link from "next/link";
import type { PartnerStore } from "@/generated/prisma/client";
import { StoreCouponMenuLink } from "@/components/coupon/store-coupon-menu-link";
import { isCouponStore } from "@/lib/coupon/config";
import { StoreCommentsSection } from "@/components/partner/store-comments-section";
import { StoreCtaBar } from "@/components/partner/store-cta-bar";
import { StoreTimelineSection } from "@/components/partner/store-timeline-section";
import type { StoreTimelineItem } from "@/components/partner/store-timeline-section";
import { StoreViewTracker } from "@/components/partner/store-view-tracker";
import { mapsEmbedSrc } from "@/lib/partner/maps-embed";
import { PARTNER_CATEGORY_LABELS } from "@/lib/partner/labels";
import { storeIntroBody, storeTaglineDisplay } from "@/lib/partner/store-copy";
import type { resolveStoreCommentPost } from "@/lib/partner/store-page";

type StoreLandingProps = {
  store: PartnerStore;
  isPreview?: boolean;
  timelineItems?: StoreTimelineItem[];
  commentPost?: Awaited<ReturnType<typeof resolveStoreCommentPost>>;
  canWriteTimeline?: boolean;
  timelineWriteHref?: string;
  canManageTimeline?: boolean;
  premiumOwnerIds?: string[];
};

export function StoreLanding({
  store,
  isPreview = false,
  timelineItems = [],
  commentPost = null,
  canWriteTimeline = false,
  timelineWriteHref,
  canManageTimeline = false,
  premiumOwnerIds = [],
}: StoreLandingProps) {
  const categoryLabel = PARTNER_CATEGORY_LABELS[store.category];
  const intro = storeIntroBody(store);
  const tagline = storeTaglineDisplay(store);
  const menuText = store.menuText?.trim();
  const hoursText = store.hoursText?.trim();
  const address = store.address?.trim();
  const locationTips = store.locationTips?.trim();
  const embedSrc = mapsEmbedSrc(address, store.mapsUrl);

  return (
    <div className="relative mx-auto w-full max-w-[480px] flex-1 bg-surface pb-24 lg:max-w-2xl lg:rounded-lg">
      {!isPreview ? <StoreViewTracker slug={store.slug} /> : null}

      {isPreview ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
          관리자 미리보기 — {store.status === "PUBLISHED" ? "공개 상태" : "비공개(draft)"}
        </div>
      ) : null}

      {/* 1. Hero — 세로·가로 포스터 모두 잘리지 않게 contain */}
      <div className="relative w-full bg-[#ebe6dc] dark:bg-transparent">
        {store.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.thumbnail}
            alt={store.name}
            className="block h-auto w-full object-contain object-center"
          />
        ) : (
          <div className="flex min-h-[min(50vh,360px)] w-full items-center justify-center bg-secondary text-sm text-muted-foreground">
            {store.name}
          </div>
        )}
      </div>

      {/* 2. Identity */}
      <header className="border-b border-border-light px-4 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          {categoryLabel}
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-foreground">
          {store.name}
        </h1>
        {tagline ? (
          <p className="mt-2 text-sm font-medium text-muted-foreground">{tagline}</p>
        ) : null}
      </header>

      {/* 3. Menu & Price */}
      {menuText ? (
        <section className="border-b border-border-light px-4 py-5">
          <h2 className="text-sm font-bold text-foreground">메뉴 · 가격</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {menuText}
          </pre>
          {isCouponStore(store.slug) ? (
            <StoreCouponMenuLink slug={store.slug} />
          ) : null}
        </section>
      ) : null}

      {/* 4. Introduction */}
      {intro ? (
        <section className="border-b border-border-light px-4 py-5">
          <h2 className="text-sm font-bold text-foreground">업체 소개</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {intro}
          </p>
        </section>
      ) : null}

      {/* 5. Timeline */}
      {timelineItems.length > 0 || canWriteTimeline ? (
        <div className="border-b border-border-light">
          <StoreTimelineSection
            items={timelineItems}
            storeSlug={store.slug}
            canWriteTimeline={canWriteTimeline}
            writeHref={timelineWriteHref}
            canManageTimeline={canManageTimeline}
          />
        </div>
      ) : null}

      {/* 6. Information */}
      {hoursText ? (
        <section className="border-b border-border-light px-4 py-5">
          <h2 className="text-sm font-bold text-foreground">이용 안내</h2>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {hoursText}
          </pre>
        </section>
      ) : null}

      {/* 7. Location */}
      {(embedSrc || address || locationTips) ? (
        <section className="border-b border-border-light px-4 py-5">
          <h2 className="text-sm font-bold text-foreground">오시는 길</h2>
          {embedSrc ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border-light">
              <iframe
                title={`${store.name} 지도`}
                src={embedSrc}
                className="h-52 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          ) : null}
          {address ? (
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              📍 {address}
            </p>
          ) : null}
          {locationTips ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {locationTips}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Comments */}
      {commentPost ? (
        <StoreCommentsSection
          postId={commentPost.id}
          comments={commentPost.comments}
          premiumOwnerIds={premiumOwnerIds}
        />
      ) : null}

      <footer className="border-t border-border-light px-4 py-5 text-center">
        <p className="text-[11px] text-muted-foreground">호케이 제휴 업소</p>
        <Link
          href="/partners"
          className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
        >
          제휴 업소 더 보기 →
        </Link>
      </footer>

      <StoreCtaBar
        slug={store.slug}
        kakaoLink={store.kakaoLink}
        phone={store.phone}
        mapsUrl={store.mapsUrl}
      />
    </div>
  );
}
