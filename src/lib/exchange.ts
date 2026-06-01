/** 1원당 VND (샘플) — 표시는 1,000원 기준 */
export const VND_PER_KRW = 18.2;

export const KRW_DISPLAY_UNIT = 1000;

export function vndForKrwUnit(unit = KRW_DISPLAY_UNIT): number {
  return VND_PER_KRW * unit;
}

export function formatVnd(amount: number): string {
  return Math.round(amount).toLocaleString("ko-KR");
}
