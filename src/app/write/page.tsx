import { WriteForm } from "@/components/write/write-form";
import { getWritableCategories } from "@/lib/categories";
import { isWritableSection, WRITE_SECTION_META } from "@/lib/write-sections";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { USER_WRITE_BANNED_MESSAGE } from "@/lib/user-moderation";
import { getPartnerStoreBySlugAnyStatus } from "@/lib/partner/queries";
import {
  canUserWriteStoreTimeline,
  getStoreTimelineWriteHref,
} from "@/lib/partner/store-timeline-write";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "글쓰기 - 호케이 Hokei",
  description: "구인, 부동산, 중고, 업소 홍보, 커뮤니티 글을 등록하세요.",
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ section?: string; partnerStore?: string }>;
}

export default async function WritePage({ searchParams }: PageProps) {
  const { section: sectionParam, partnerStore: partnerStoreParam } =
    await searchParams;
  const sectionSlug =
    sectionParam && isWritableSection(sectionParam) ? sectionParam : undefined;

  if (sectionParam && !sectionSlug) {
    notFound();
  }

  const partnerStoreSlug = partnerStoreParam?.trim() || undefined;
  let partnerStoreContext:
    | {
        name: string;
        slug: string;
        kakaoLink: string | null;
      }
    | undefined;

  if (partnerStoreSlug) {
    if (sectionSlug !== "promo") {
      notFound();
    }

    const session = await auth();
    const writeHref = getStoreTimelineWriteHref(partnerStoreSlug);

    if (!session?.user) {
      redirect(`/login?callbackUrl=${encodeURIComponent(writeHref)}`);
    }

    const store = await getPartnerStoreBySlugAnyStatus(partnerStoreSlug);
    if (!store || !canUserWriteStoreTimeline(session, store)) {
      redirect(`/store/${partnerStoreSlug}`);
    }

    partnerStoreContext = {
      name: store.name,
      slug: store.slug,
      kakaoLink: store.kakaoLink,
    };
  }

  const categories = await getWritableCategories(
    sectionSlug ? { sectionSlug } : undefined
  );

  if (categories.length === 0) {
    notFound();
  }

  const meta = sectionSlug ? WRITE_SECTION_META[sectionSlug] : null;
  const pageTitle = partnerStoreContext
    ? `${partnerStoreContext.name} · 타임라인`
    : (meta?.title ?? "글쓰기");
  const defaultCategoryId =
    categories.find((c) => c.slug === meta?.defaultCategorySlug)?.id ??
    categories[0]!.id;

  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isSuspended: true, writeBanned: true },
    });
    if (user?.isSuspended) {
      redirect("/login?suspended=1");
    }
    if (user?.writeBanned) {
      return (
        <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-surface p-6">
          <h1 className="text-lg font-bold">글쓰기 제한</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {USER_WRITE_BANNED_MESSAGE}
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            홈으로 돌아가기
          </Link>
        </div>
      );
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[480px] bg-surface">
      <WriteForm
        key={`${sectionSlug ?? "write"}-${partnerStoreContext?.slug ?? ""}`}
        pageTitle={pageTitle}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        sectionSlug={sectionSlug}
        lockedStoreName={partnerStoreContext?.name}
        defaultKakaoLink={partnerStoreContext?.kakaoLink ?? undefined}
        successRedirectHref={
          partnerStoreContext
            ? `/store/${partnerStoreContext.slug}`
            : undefined
        }
      />
    </div>
  );
}
