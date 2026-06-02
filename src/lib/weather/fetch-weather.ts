import type { WeatherSnapshot } from "@/lib/weather/types";

const FALLBACK: WeatherSnapshot = {
  tempC: 32,
  feelsLikeC: 36,
  humidity: 72,
  windKmh: 12,
  description: "맑음",
  updatedAt: new Date().toISOString(),
  source: "fallback",
};

type OpenWeatherResponse = {
  main: { temp: number; feels_like: number; humidity: number };
  wind?: { speed?: number };
  weather?: { description?: string }[];
};

export async function getHoChiMinhWeather(): Promise<WeatherSnapshot> {
  const apiKey = process.env.OPENWEATHER_API_KEY?.trim();
  if (!apiKey) return FALLBACK;

  try {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", "Ho Chi Minh City,VN");
    url.searchParams.set("appid", apiKey);
    url.searchParams.set("units", "metric");
    url.searchParams.set("lang", "kr");

    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 },
    });

    if (!res.ok) return FALLBACK;

    const data = (await res.json()) as OpenWeatherResponse;
    const windMs = data.wind?.speed ?? 0;

    return {
      tempC: Math.round(data.main.temp),
      feelsLikeC: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windKmh: Math.round(windMs * 3.6),
      description: data.weather?.[0]?.description ?? "—",
      updatedAt: new Date().toISOString(),
      source: "openweather",
    };
  } catch {
    return FALLBACK;
  }
}
