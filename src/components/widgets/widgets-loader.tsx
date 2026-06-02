"use client";

import { useEffect, useState } from "react";
import type { ExchangeSnapshot } from "@/lib/exchange/types";
import type { WeatherSnapshot } from "@/lib/weather/types";
import {
  ExchangeDisplay,
  ExchangeDisplayHeader,
} from "@/components/widgets/exchange-display";
import {
  WeatherDisplay,
  WeatherDisplayHeader,
} from "@/components/widgets/weather-display";

const weatherFallback: WeatherSnapshot = {
  tempC: 32,
  feelsLikeC: 36,
  humidity: 72,
  windKmh: 12,
  description: "맑음",
  updatedAt: new Date().toISOString(),
  source: "fallback",
};

const exchangeFallback: ExchangeSnapshot = {
  vndPerKrw: 18.2,
  updatedAt: new Date().toISOString(),
  source: "fallback",
};

type WidgetsLoaderProps = {
  variant: "weather" | "exchange" | "quick-stats";
};

export function WidgetsLoader({ variant }: WidgetsLoaderProps) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [exchange, setExchange] = useState<ExchangeSnapshot | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch("/api/widgets/weather").then((r) => r.json()),
      fetch("/api/widgets/exchange").then((r) => r.json()),
    ]).then(([w, e]) => {
      setWeather(w as WeatherSnapshot);
      setExchange(e as ExchangeSnapshot);
    }).catch(() => {
      setWeather(weatherFallback);
      setExchange(exchangeFallback);
    });
  }, []);

  if (variant === "weather") {
    const data = weather ?? weatherFallback;
    return (
      <div className="rounded-2xl bg-white p-4">
        <WeatherDisplayHeader />
        <WeatherDisplay data={data} />
      </div>
    );
  }

  if (variant === "exchange") {
    const data = exchange ?? exchangeFallback;
    return (
      <div className="rounded-2xl bg-white p-4">
        <ExchangeDisplayHeader />
        <ExchangeDisplay data={data} />
      </div>
    );
  }

  const w = weather ?? weatherFallback;
  const e = exchange ?? exchangeFallback;

  return (
    <section className="grid grid-cols-2 gap-1 lg:hidden" aria-label="빠른 통계">
      <div className="bg-white px-2 py-2">
        <WeatherDisplayHeader compact />
        <WeatherDisplay data={w} compact />
      </div>
      <div className="bg-white px-2 py-2">
        <ExchangeDisplayHeader compact />
        <ExchangeDisplay data={e} compact />
      </div>
    </section>
  );
}
