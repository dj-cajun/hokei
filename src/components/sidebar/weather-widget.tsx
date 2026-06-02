import { getHoChiMinhWeather } from "@/lib/weather/fetch-weather";
import {
  WeatherDisplay,
  WeatherDisplayHeader,
} from "@/components/widgets/weather-display";

export async function WeatherWidget() {
  const data = await getHoChiMinhWeather();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <WeatherDisplayHeader />
      <WeatherDisplay data={data} />
    </div>
  );
}
