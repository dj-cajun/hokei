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
import { getCachedLiveStats } from "@/lib/widgets/cached-live-stats";
import { log } from "@/lib/logger";

/** 홈 서버 섹션 실패 시 전체 페이지 error boundary로 가지 않도록 */
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
