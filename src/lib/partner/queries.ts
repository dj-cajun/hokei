import type { PartnerCategory } from "@/generated/prisma";
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
