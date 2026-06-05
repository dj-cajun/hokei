import type { WeatherSnapshot } from "@/lib/weather/types";

const HO_CHI_MINH_QUERY = "Ho Chi Minh City";

const FALLBACK: WeatherSnapshot = {
  tempC: 32,
  feelsLikeC: 36,
  humidity: 72,
  windKmh: 12,
  description: "맑음",
  updatedAt: new Date().toISOString(),
  source: "fallback",
};

type WeatherApiCurrentResponse = {
  current?: {
    last_updated?: string;
    temp_c?: number;
    feelslike_c?: number;
    humidity?: number;
    wind_kph?: number;
    condition?: { text?: string };
  };
  error?: { message?: string };
};

function resolveWeatherApiKey(): string {
  return (
    process.env.WEATHERAPI_KEY?.trim() ??
    process.env.OPENWEATHER_API_KEY?.trim() ??
    ""
  );
}

export async function getHoChiMinhWeather(): Promise<WeatherSnapshot> {
  const apiKey = resolveWeatherApiKey();
  if (!apiKey) return FALLBACK;

  try {
    const url = new URL("https://api.weatherapi.com/v1/current.json");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", HO_CHI_MINH_QUERY);
    url.searchParams.set("lang", "ko");

    const res = await fetch(url.toString(), {
      next: { revalidate: 600 },
    });

    if (!res.ok) return FALLBACK;

    const data = (await res.json()) as WeatherApiCurrentResponse;
    const current = data.current;
    if (!current || data.error) return FALLBACK;

    const updatedAt = current.last_updated
      ? new Date(current.last_updated).toISOString()
      : new Date().toISOString();

    return {
      tempC: Math.round(current.temp_c ?? FALLBACK.tempC),
      feelsLikeC: Math.round(current.feelslike_c ?? FALLBACK.feelsLikeC),
      humidity: current.humidity ?? FALLBACK.humidity,
      windKmh: Math.round(current.wind_kph ?? FALLBACK.windKmh),
      description: current.condition?.text ?? "—",
      updatedAt,
      source: "weatherapi",
    };
  } catch {
    return FALLBACK;
  }
}
