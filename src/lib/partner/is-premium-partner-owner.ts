/** 프리미엄 제휴 업소 사장님 user id 집합에 포함되는지 (클라이언트·서버 공용) */
export function isPremiumPartnerOwner(
  userId: string | null | undefined,
  premiumOwnerIds: ReadonlySet<string>
): boolean {
  return Boolean(userId && premiumOwnerIds.has(userId));
}
