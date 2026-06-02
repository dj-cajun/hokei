export type WeatherSnapshot = {
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  description: string;
  updatedAt: string;
  source: "openweather" | "fallback";
};
