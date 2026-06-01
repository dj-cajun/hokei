import { TrendingUp } from "lucide-react";
import {
  formatVnd,
  KRW_DISPLAY_UNIT,
  VND_PER_KRW,
  vndForKrwUnit,
} from "@/lib/exchange";

export function ExchangeWidget() {
  const vnd = vndForKrwUnit();

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">환율</h3>
        <TrendingUp className="h-4 w-4 text-emerald-600" />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
          <span className="text-sm text-muted-foreground">VND/KRW</span>
          <span className="text-sm font-semibold">
            ₩{KRW_DISPLAY_UNIT.toLocaleString("ko-KR")} = ₫{formatVnd(vnd)}
          </span>
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          ₫1,000 ≈ ₩{(1000 / VND_PER_KRW).toFixed(1)}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">기준: 2026.06.01 09:00 (ICT)</p>
    </div>
  );
}
