import type { ModerationStatus, Prisma } from "@/generated/prisma/client";

export type AdminPostSearchParams = {
  q?: string;
  storeName?: string;
  moderation?: ModerationStatus | "ALL";
  guestOnly?: boolean;
  /** 1depth 섹션 slug (community, promo, news …) */
  sectionSlug?: string;
  /** leaf 카테고리 id */
  categoryId?: string;
};

export function parseAdminPostSearchParams(
  searchParams: URLSearchParams
): AdminPostSearchParams {
  const moderation = searchParams.get("moderation") as
    | ModerationStatus
    | "ALL"
    | null;

  return {
    q: searchParams.get("q")?.trim() || undefined,
    storeName: searchParams.get("storeName")?.trim() || undefined,
    moderation: moderation ?? undefined,
    guestOnly: searchParams.get("guestOnly") === "1",
    sectionSlug: searchParams.get("section")?.trim() || undefined,
    categoryId: searchParams.get("categoryId")?.trim() || undefined,
  };
}

export function buildAdminPostWhere(
  params: AdminPostSearchParams
): Prisma.PostWhereInput {
  const where: Prisma.PostWhereInput = {};
  const q = params.q?.trim();
  const storeName = params.storeName?.trim();

  if (params.moderation && params.moderation !== "ALL") {
    where.moderationStatus = params.moderation;
  }
  if (params.guestOnly) {
    where.authorId = null;
    where.guestName = { not: null };
  }
  if (params.categoryId) {
    where.categoryId = params.categoryId;
  } else if (params.sectionSlug) {
    where.category = {
      OR: [
        { parent: { slug: params.sectionSlug } },
        { slug: params.sectionSlug },
      ],
    };
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
      { guestName: { contains: q, mode: "insensitive" } },
      { author: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (storeName) {
    where.storeName = { contains: storeName, mode: "insensitive" };
  }
  return where;
}
