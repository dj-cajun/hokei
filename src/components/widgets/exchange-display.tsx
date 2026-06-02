import { TrendingUp } from "lucide-react";
import { KRW_DISPLAY_UNIT } from "@/lib/exchange";
import {
  formatExchangeUpdatedAt,
  formatVnd,
  vndForKrwUnit,
} from "@/lib/exchange/format";
import type { ExchangeSnapshot } from "@/lib/exchange/types";

type ExchangeDisplayProps = {
  data: ExchangeSnapshot;
  compact?: boolean;
};

export function ExchangeDisplay({ data, compact = false }: ExchangeDisplayProps) {
  const vnd = vndForKrwUnit(data);

  if (compact) {
    return (
      <>
        <p className="mt-0.5 text-base font-bold leading-none">₫{formatVnd(vnd)}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          ₩{KRW_DISPLAY_UNIT.toLocaleString("ko-KR")} = ₫{formatVnd(vnd)}
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mt-3">
        <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2">
          <span className="text-sm text-muted-foreground">VND/KRW</span>
          <span className="text-sm font-semibold">
            ₩{KRW_DISPLAY_UNIT.toLocaleString("ko-KR")} = ₫{formatVnd(vnd)}
          </span>
        </div>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          ₫1,000 ≈ ₩{(1000 / data.vndPerKrw).toFixed(1)}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        기준: {formatExchangeUpdatedAt(data.updatedAt)} (ICT)
        {data.source === "fallback" ? " · 샘플" : ""}
      </p>
    </>
  );
}

export function ExchangeDisplayHeader({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h3
        className={
          compact
            ? "text-[11px] font-medium text-gray-400"
            : "text-sm font-semibold text-foreground"
        }
      >
        {compact ? `VND/${KRW_DISPLAY_UNIT.toLocaleString("ko-KR")}원` : "환율"}
      </h3>
      <TrendingUp
        className={
          compact ? "h-3.5 w-3.5 text-emerald-600" : "h-4 w-4 text-emerald-600"
        }
      />
    </div>
  );
}
