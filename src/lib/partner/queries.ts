import type {
  PartnerBannerSlot,
  PartnerCategory,
  PartnerStore,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** 공개 LP·허브 — PUBLISHED 이고 만료 전만 */
export function publishedPartnerWhere(now = new Date()) {
  return {
    status: "PUBLISHED" as const,
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };
}

export function isPartnerStorePublic(
  store: Pick<PartnerStore, "status" | "expiresAt">,
  now = new Date()
): boolean {
  return (
    store.status === "PUBLISHED" &&
    (store.expiresAt === null || store.expiresAt > now)
  );
}

/** slug로 레코드 조회 (상태 무관 — T2-3 공개 여부 판별용) */
export async function getPartnerStoreRecordBySlug(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) return null;

  return prisma.partnerStore.findUnique({
    where: { slug: trimmed },
  });
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

export async function listPartnerStoresForAdmin() {
  return prisma.partnerStore.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    include: { _count: { select: { banners: true } } },
  });
}

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

function activeBannerDateWhere(now = new Date()) {
  return {
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
    ],
  };
}

export async function listBannersForSlot(slot: PartnerBannerSlot, now = new Date()) {
  return prisma.partnerBanner.findMany({
    where: {
      slot,
      isActive: true,
      ...activeBannerDateWhere(now),
      store: publishedPartnerWhere(now),
    },
    include: {
      store: {
        select: { slug: true, name: true, status: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function listPartnerBannersForAdmin() {
  return prisma.partnerBanner.findMany({
    orderBy: [{ slot: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
    include: {
      store: { select: { id: true, name: true, slug: true } },
    },
  });
}
