import { BoardPreviewSectionBox } from "@/components/home/board-preview-section";
import {
  ExchangeDisplay,
  ExchangeDisplayHeader,
} from "@/components/widgets/exchange-display";
import {
  WeatherDisplay,
  WeatherDisplayHeader,
} from "@/components/widgets/weather-display";
import { getBoardPreviewSections } from "@/lib/data/board-preview";
import { log } from "@/lib/logger";
import { getCachedLiveStats } from "@/lib/widgets/cached-live-stats";

/** 홈 모바일 — 날씨·환율 2열 (상단 배너는 HomeTopBanner) */
export async function SafeWeatherQuickGrid() {
  let stats;
  try {
    stats = await getCachedLiveStats();
  } catch (err) {
    log("error", "[home] WeatherExchangeQuickGrid", { err });
    return null;
  }

  const { weather, exchange } = stats;
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

/** @deprecated SafeWeatherQuickGrid 사용 */
export async function SafeHomeMobileTopRow() {
  return SafeWeatherQuickGrid();
}

export async function SafeBoardPreviewList() {
  let sections;
  try {
    sections = await getBoardPreviewSections();
  } catch (err) {
    log("error", "[home] BoardPreviewList", { err });
    return null;
  }

  return (
    <div className="space-y-0 lg:space-y-4">
      {sections.map((section) => (
        <BoardPreviewSectionBox key={section.title} section={section} />
      ))}
    </div>
  );
}
