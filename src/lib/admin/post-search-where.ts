import type { ModerationStatus, Prisma } from "@/generated/prisma/client";

export type AdminPostSearchParams = {
  q?: string;
  storeName?: string;
  moderation?: ModerationStatus | "ALL";
  guestOnly?: boolean;
};

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
