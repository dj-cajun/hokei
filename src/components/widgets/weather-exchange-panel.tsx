import {
  ExchangeDisplay,
  ExchangeDisplayHeader,
} from "@/components/widgets/exchange-display";
import { ExchangeCalculatorShell } from "@/components/widgets/exchange-calculator-shell";
import {
  WeatherDisplay,
  WeatherDisplayHeader,
} from "@/components/widgets/weather-display";
import {
  getCachedExchangeRate,
  getCachedHoChiMinhWeather,
  getCachedLiveStats,
} from "@/lib/widgets/cached-live-stats";
import type { ReactNode } from "react";

type SidebarCardProps = {
  children: ReactNode;
};

function SidebarCard({ children }: SidebarCardProps) {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">{children}</div>
  );
}

export async function WeatherStatsPanel() {
  const data = await getCachedHoChiMinhWeather();
  return (
    <SidebarCard>
      <WeatherDisplayHeader />
      <WeatherDisplay data={data} />
    </SidebarCard>
  );
}

export async function ExchangeStatsPanel() {
  const data = await getCachedExchangeRate();
  return (
    <SidebarCard>
      <ExchangeDisplayHeader />
      <ExchangeDisplay data={data} />
      <ExchangeCalculatorShell vndPerKrw={data.vndPerKrw} />
    </SidebarCard>
  );
}

/** 홈 모바일 — 날씨·환율 2열 그리드 (단일 fetch) */
export async function WeatherExchangeQuickGrid() {
  const { weather, exchange } = await getCachedLiveStats();

  return (
    <section
      className="grid grid-cols-2 gap-1 lg:hidden"
      aria-label="빠른 통계"
    >
      <div className="bg-surface px-2 py-2">
        <WeatherDisplayHeader compact />
        <WeatherDisplay data={weather} compact />
      </div>
      <div className="bg-surface px-2 py-2">
        <ExchangeDisplayHeader compact />
        <ExchangeDisplay data={exchange} compact />
      </div>
    </section>
  );
}
