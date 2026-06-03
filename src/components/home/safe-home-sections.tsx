import { BoardPreviewList } from "@/components/home/board-preview-list";
import { WeatherExchangeQuickGrid } from "@/components/widgets/weather-exchange-panel";
import { log } from "@/lib/logger";

/** 홈 서버 섹션 실패 시 전체 페이지 error boundary로 가지 않도록 */
export async function SafeWeatherQuickGrid() {
  try {
    return <WeatherExchangeQuickGrid />;
  } catch (err) {
    log("error", "[home] WeatherExchangeQuickGrid", { err });
    return null;
  }
}

export async function SafeBoardPreviewList() {
  try {
    return <BoardPreviewList />;
  } catch (err) {
    log("error", "[home] BoardPreviewList", { err });
    return null;
  }
}
