import { revalidatePath } from "next/cache";
import { slugifyStoreName } from "@/lib/admin/publish-curated-trade";
import { prisma } from "@/lib/prisma";
import { getPartnerStoreByOwnerId } from "@/lib/partner/queries";
import { promoStoreTimelineHref } from "@/lib/site-navigation";

/** 홍보 글 등록 후 업소 LP·타임라인 캐시 갱신 */
export async function revalidatePromoStoreTimeline(storeName: string) {
  const trimmed = storeName.trim();
  if (!trimmed) return;

  revalidatePath(promoStoreTimelineHref(slugifyStoreName(trimmed)));

  const partner = await prisma.partnerStore.findFirst({
    where: { name: { equals: trimmed, mode: "insensitive" } },
    select: { slug: true },
  });
  if (partner?.slug) {
    revalidatePath(`/store/${partner.slug}`);
  }
}

/** 제휴 업소 사장님은 본인 업소명으로만 promo 글 등록 */
export async function assertPartnerOwnerPromoStoreName(
  userId: string,
  role: string | undefined,
  storeName: string | undefined
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (role === "ADMIN") return { ok: true };

  const ownerStore = await getPartnerStoreByOwnerId(userId);
  if (!ownerStore) return { ok: true };

  const submitted = storeName?.trim().toLowerCase();
  const owned = ownerStore.name.trim().toLowerCase();
  if (!submitted || submitted !== owned) {
    return {
      ok: false,
      message: "제휴 업소 사장님은 본인 업소명으로만 홍보 글을 등록할 수 있습니다.",
    };
  }

  return { ok: true };
}
