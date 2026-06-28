import { cache } from "react";
import type { PartnerBannerSlot, PartnerCategory } from "@/generated/prisma/client";
import { pickPartnerBannerForOg } from "@/lib/partner/banner-og-pick";
import { prisma } from "@/lib/prisma";

/** 공개 LP·허브 — PUBLISHED 이고 만료 전만 */
export function publishedPartnerWhere(now = new Date()) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export async function getPartnerStoreBySlug(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  return prisma.partnerStore.findFirst({
    where: {
      slug: trimmed,
      ...publishedPartnerWhere(),
    },
  });
}

/** 동일 RSC 요청 내 LP 조회 dedup (generateMetadata + page) */
export const getPartnerStoreBySlugCached = cache((slug: string) =>
  getPartnerStoreBySlug(slug)
);

/** 관리자 draft LP 미리보기 */
export async function getPartnerStoreBySlugAnyStatus(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  return prisma.partnerStore.findUnique({
    where: { slug: trimmed },
  });
}

/** 사장님 셀프 서비스 — ARCHIVED 제외, 최근 수정 우선 */
export async function getPartnerStoreByOwnerId(ownerId: string) {
  if (!ownerId.trim()) return null;

  return prisma.partnerStore.findFirst({
    where: {
      ownerId,
      status: { not: "ARCHIVED" },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listPublishedPartnerSlugs(limit = 200) {
  const take = Math.min(Math.max(limit, 1), 500);

  return prisma.partnerStore.findMany({
    where: publishedPartnerWhere(),
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function getPartnerEventSummary(since: Date) {
  const rows = await prisma.partnerEvent.groupBy({
    by: ["storeId", "eventType"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  const byStore = new Map<
    string,
    { views: number; clicks: number; total: number }
  >();

  for (const row of rows) {
    const entry = byStore.get(row.storeId) ?? {
      views: 0,
      clicks: 0,
      total: 0,
    };
    const count = row._count._all;
    entry.total += count;
    if (row.eventType === "VIEW") {
      entry.views += count;
    } else {
      entry.clicks += count;
    }
    byStore.set(row.storeId, entry);
  }

  return byStore;
}

export async function listPublishedPartners(options?: {
  limit?: number;
  category?: PartnerCategory;
}) {
  const limit = Math.min(Math.max(options?.limit ?? 48, 1), 100);

  return prisma.partnerStore.findMany({
    where: {
      ...publishedPartnerWhere(),
      ...(options?.category ? { category: options.category } : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    take: limit,
  });
}

export function activePartnerBannerWhere(now = new Date()) {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

export async function listBannersForSlot(
  slot: PartnerBannerSlot,
  limit = 5
) {
  const take = Math.min(Math.max(limit, 1), 10);
  const now = new Date();

  return prisma.partnerBanner.findMany({
    where: {
      slot,
      ...activePartnerBannerWhere(now),
      store: publishedPartnerWhere(now),
    },
    include: {
      store: { select: { slug: true, name: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take,
  });
}

export type PartnerBannerWithStore = Awaited<
  ReturnType<typeof listBannersForSlot>
>[number];

/** 업소별 활성 배너 (OG·운영 확인용) */
export async function getActivePartnerBannerForStore(storeId: string) {
  const trimmed = storeId.trim();
  if (!trimmed) return null;

  const now = new Date();
  const banners = await prisma.partnerBanner.findMany({
    where: {
      storeId: trimmed,
      ...activePartnerBannerWhere(now),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return pickPartnerBannerForOg(banners);
}

/** 동일 RSC 요청 내 배너 조회 dedup */
export const listBannersForSlotCached = cache(
  (slot: PartnerBannerSlot, limit = 5) => listBannersForSlot(slot, limit)
);

/** slug 중복 확인 (admin·resolveUniquePartnerSlug) */
export async function isPartnerSlugTaken(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const trimmed = slug.trim();
  if (!trimmed) return false;

  const existing = await prisma.partnerStore.findUnique({
    where: { slug: trimmed },
    select: { id: true },
  });

  if (!existing) return false;
  if (excludeId && existing.id === excludeId) return false;
  return true;
}
