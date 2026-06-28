import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { StoreLanding } from "@/components/partner/store-landing";
import { LocalBusinessJsonLd } from "@/components/seo/local-business-json-ld";
import { isDatabaseAvailable } from "@/lib/database-available";
import {
  getPartnerStoreBySlugAnyStatus,
  getPartnerStoreBySlugCached,
} from "@/lib/partner/queries";
import { resolveStoreCommentPost } from "@/lib/partner/store-page";
import { getPromoPostsByStore } from "@/lib/promo/queries";
import { resolveStoreOgImage } from "@/lib/partner/resolve-store-og";
import {
  canUserWriteStoreTimeline,
  getStoreTimelineWriteHref,
} from "@/lib/partner/store-timeline-write";
import { getPremiumPartnerOwnerIds } from "@/lib/partner/premium-owners";
import { resolveSiteUrl } from "@/lib/site-url";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

async function resolveStore(slug: string, previewRequested: boolean) {
  const published = await getPartnerStoreBySlugCached(slug);
  if (published) {
    return { store: published, isPreview: false };
  }

  if (!previewRequested) {
    return { store: null, isPreview: false };
  }

  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { store: null, isPreview: false };
  }

  const draft = await getPartnerStoreBySlugAnyStatus(slug);
  if (!draft || draft.status === "ARCHIVED") {
    return { store: null, isPreview: false };
  }

  return { store: draft, isPreview: true };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isDatabaseAvailable()) {
    return { title: "제휴 업소 - 호케이" };
  }

  const store = await getPartnerStoreBySlugCached(slug);
  if (!store) {
    return { title: "업소를 찾을 수 없음 - 호케이" };
  }

  const description =
    store.introText?.trim() ||
    store.tagline?.trim() ||
    store.description?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `${store.name} - 호케이 제휴 업소`;
  const siteUrl = resolveSiteUrl();
  const canonical = `${siteUrl}/store/${store.slug}`;
  const { url: ogImage } = await resolveStoreOgImage(store, siteUrl);

  return {
    title: `${store.name} | 호케이`,
    description,
    alternates: { canonical },
    openGraph: {
      title: store.name,
      description,
      url: canonical,
      type: "website",
      locale: "ko_KR",
      siteName: "호케이 Hokei",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: store.name,
      description,
      images: [ogImage],
    },
  };
}

export default async function PartnerStorePage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;

  if (!isDatabaseAvailable()) {
    notFound();
  }

  const { store, isPreview } = await resolveStore(slug, preview === "1");
  if (!store) {
    notFound();
  }

  const [promo, commentPost, session, premiumOwnerIds] = await Promise.all([
    getPromoPostsByStore(store.slug, 8, store.name),
    resolveStoreCommentPost(store),
    auth(),
    getPremiumPartnerOwnerIds(),
  ]);

  const timelineItems = promo.items.map((item) => ({
    id: item.id,
    title: item.title,
    summary: item.summary,
    publishedAt: item.publishedAt,
    thumbnail: item.thumbnail,
    isCrawl: item.isCrawl,
  }));

  const canWriteTimeline = canUserWriteStoreTimeline(session, store);
  const canManageTimeline = canWriteTimeline;
  const timelineWriteHref = canWriteTimeline
    ? getStoreTimelineWriteHref(store.slug)
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <LocalBusinessJsonLd store={store} />
      <Sidebar />
      <StoreLanding
        store={store}
        isPreview={isPreview}
        timelineItems={timelineItems}
        commentPost={commentPost}
        canWriteTimeline={canWriteTimeline}
        timelineWriteHref={timelineWriteHref}
        canManageTimeline={canManageTimeline}
        premiumOwnerIds={[...premiumOwnerIds]}
      />
    </div>
  );
}
