export type AgencyCommission = {
  commissionFixed: number | { toString(): string };
  commissionPercent?: number | { toString(): string } | null;
};

/** 교환 1건 플랫폼 수수료 — percent 우선, 없으면 고정액 */
export function platformFeeAmount(
  agency: AgencyCommission,
  productPrice: number | { toString(): string },
): number {
  const percent =
    agency.commissionPercent != null ? Number(agency.commissionPercent) : null;
  if (percent != null && percent > 0) {
    return Math.round((Number(productPrice) * percent) / 100);
  }
  return Number(agency.commissionFixed);
}
