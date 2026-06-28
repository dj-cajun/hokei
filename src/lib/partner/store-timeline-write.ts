import type { PartnerStore } from "@/generated/prisma/client";
import type { Session } from "next-auth";
import { getPartnerStoreByOwnerId } from "@/lib/partner/queries";

/** 업소 LP 타임라인 — 사장님 전용 글쓰기 */
export function getStoreTimelineWriteHref(storeSlug: string): string {
  return `/write?section=promo&partnerStore=${encodeURIComponent(storeSlug.trim())}`;
}

export function canUserWriteStoreTimeline(
  session: Session | null | undefined,
  store: Pick<PartnerStore, "ownerId" | "status">
): boolean {
  return canUserManageStoreTimeline(session, store);
}

/** 업소 타임라인 글쓰기·수정·삭제 — 사장님·관리자 */
export function canUserManageStoreTimeline(
  session: Session | null | undefined,
  store: Pick<PartnerStore, "ownerId" | "status">
): boolean {
  if (!session?.user?.id) return false;
  if (store.status === "ARCHIVED") return false;
  if (session.user.role === "ADMIN") return true;
  if (!store.ownerId) return false;
  return store.ownerId === session.user.id;
}

/** promo 글 storeName 기준 — 사장님·관리자 수정·삭제 */
export async function canUserManagePromoPostByStoreName(
  session: Session | null | undefined,
  postStoreName: string | null | undefined
): Promise<boolean> {
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;

  const trimmed = postStoreName?.trim();
  if (!trimmed) return false;

  const store = await getPartnerStoreByOwnerId(session.user.id);
  if (!store) return false;

  return store.name.trim().toLowerCase() === trimmed.toLowerCase();
}
