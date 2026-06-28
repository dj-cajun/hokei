import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { StoreTimelinePostActions } from "@/components/partner/store-timeline-post-actions";
import { isDatabaseAvailable } from "@/lib/database-available";
import { getPartnerStoreBySlugCached } from "@/lib/partner/queries";
import {
  canUserManageStoreTimeline,
} from "@/lib/partner/store-timeline-write";
import { getPromoPostsByStore } from "@/lib/promo/queries";
import { formatRelativeTime } from "@/lib/format/date";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ store: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { store } = await params;
  if (!isDatabaseAvailable()) return { title: "업소 홍보 - 호케이" };
  const { storeName } = await getPromoPostsByStore(store, 1);
  return {
    title: storeName
      ? `${storeName} - 한인 업소 홍보`
      : "업소 홍보 - 호케이",
  };
}

export default async function PromoStoreTimelinePage({ params }: PageProps) {
  const { store } = await params;
  if (!isDatabaseAvailable()) notFound();

  const { storeName, items } = await getPromoPostsByStore(store);
  if (!storeName || items.length === 0) notFound();

  const partnerStore = await getPartnerStoreBySlugCached(store);
  const session = await auth();
  const canManageTimeline =
    partnerStore && canUserManageStoreTimeline(session, partnerStore);

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col lg:max-w-6xl lg:flex-row lg:gap-6 lg:px-4 lg:py-6">
      <Sidebar />
      <div className="min-w-0 flex-1 bg-surface lg:rounded-lg">
        <header className="border-b border-border-light px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link
                href="/promo"
                className="text-[10px] text-primary hover:underline"
              >
                ← 찐 생활정보
              </Link>
              <h1 className="mt-1 text-base font-bold">{storeName}</h1>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {items.length}건의 홍보·전단 아카이브
              </p>
            </div>
          </div>
          {partnerStore ? (
            <Link
              href={`/store/${partnerStore.slug}`}
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              제휴 업소 페이지 보기 →
            </Link>
          ) : null}
        </header>

        <ul className="relative my-3 ml-3 space-y-4 border-l-2 border-rose-200/80 py-2 pl-4">
          {items.map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-surface" />
              <div className="overflow-hidden rounded-lg border border-border-light">
                <Link
                  href={`/posts/${item.id}`}
                  className="block px-3 py-2 hover:bg-card-hover"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                    {item.summary}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {formatRelativeTime(item.publishedAt)}
                    {item.isCrawl && " · AI 정제"}
                  </p>
                </Link>
                {canManageTimeline ? (
                  <StoreTimelinePostActions
                    postId={item.id}
                    redirectHref={`/promo/timeline/${store}`}
                    mode="edit"
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
