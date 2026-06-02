import { KRW_DISPLAY_UNIT } from "@/lib/exchange";
import type { ExchangeSnapshot } from "@/lib/exchange/types";

export function formatVnd(amount: number): string {
  return Math.round(amount).toLocaleString("ko-KR");
}

export function vndForKrwUnit(
  snapshot: ExchangeSnapshot,
  unit = KRW_DISPLAY_UNIT
): number {
  return snapshot.vndPerKrw * unit;
}

export function formatExchangeUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Ho_Chi_Minh",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
