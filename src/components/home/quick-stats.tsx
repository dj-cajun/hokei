import { CloudSun, TrendingUp } from "lucide-react";
import {
  formatVnd,
  KRW_DISPLAY_UNIT,
  vndForKrwUnit,
} from "@/lib/exchange";

export function QuickStats() {
  const vnd = vndForKrwUnit();

  return (
    <section
      className="grid grid-cols-2 gap-1 lg:hidden"
      aria-label="빠른 통계"
    >
      <div className="bg-white px-2 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-400">
            호치민 날씨
          </span>
          <CloudSun className="h-3.5 w-3.5 text-amber-500" />
        </div>
        <p className="mt-0.5 text-base font-bold leading-none">32°C</p>
        <p className="mt-0.5 text-[11px] text-gray-400">맑음 · 습도 72%</p>
      </div>
      <div className="bg-white px-2 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-gray-400">
            VND/1,000원
          </span>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <p className="mt-0.5 text-base font-bold leading-none">
          ₫{formatVnd(vnd)}
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          ₩{KRW_DISPLAY_UNIT.toLocaleString("ko-KR")} = ₫{formatVnd(vnd)}
        </p>
      </div>
    </section>
  );
}
