import { cache } from "react";
import { getExchangeRate } from "@/lib/exchange/fetch-rate";
import { getHoChiMinhWeather } from "@/lib/weather/fetch-weather";

/** 동일 RSC 트리에서 날씨·환율 API 중복 호출 방지 */
export const getCachedHoChiMinhWeather = cache(getHoChiMinhWeather);
export const getCachedExchangeRate = cache(getExchangeRate);

export async function getCachedLiveStats() {
  const [weather, exchange] = await Promise.all([
    getCachedHoChiMinhWeather(),
    getCachedExchangeRate(),
  ]);
  return { weather, exchange };
}
