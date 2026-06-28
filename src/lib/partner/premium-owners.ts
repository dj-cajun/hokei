import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { publishedPartnerWhere } from "@/lib/partner/queries";

export { isPremiumPartnerOwner } from "@/lib/partner/is-premium-partner-owner";

/** 공개 PREMIUM 플랜 업소의 사장님 user id */
export const getPremiumPartnerOwnerIds = cache(async (): Promise<Set<string>> => {
  const rows = await prisma.partnerStore.findMany({
    where: {
      ...publishedPartnerWhere(),
      plan: "PREMIUM",
      ownerId: { not: null },
    },
    select: { ownerId: true },
  });

  return new Set(
    rows.map((r) => r.ownerId).filter((id): id is string => Boolean(id))
  );
});
