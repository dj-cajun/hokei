import { getExchangeRate } from "@/lib/exchange/fetch-rate";
import { getHoChiMinhWeather } from "@/lib/weather/fetch-weather";
import {
  ExchangeDisplay,
  ExchangeDisplayHeader,
} from "@/components/widgets/exchange-display";
import {
  WeatherDisplay,
  WeatherDisplayHeader,
} from "@/components/widgets/weather-display";

export async function QuickStats() {
  const [weather, exchange] = await Promise.all([
    getHoChiMinhWeather(),
    getExchangeRate(),
  ]);

  return (
    <section
      className="grid grid-cols-2 gap-1 lg:hidden"
      aria-label="빠른 통계"
    >
      <div className="bg-white px-2 py-2">
        <WeatherDisplayHeader compact />
        <WeatherDisplay data={weather} compact />
      </div>
      <div className="bg-white px-2 py-2">
        <ExchangeDisplayHeader compact />
        <ExchangeDisplay data={exchange} compact />
      </div>
    </section>
  );
}
