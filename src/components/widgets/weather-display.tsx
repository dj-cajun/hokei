import { CloudSun, Droplets, Wind } from "lucide-react";
import type { WeatherSnapshot } from "@/lib/weather/types";

type WeatherDisplayProps = {
  data: WeatherSnapshot;
  compact?: boolean;
};

export function WeatherDisplay({ data, compact = false }: WeatherDisplayProps) {
  if (compact) {
    return (
      <>
        <p className="mt-0.5 text-base font-bold leading-none">{data.tempC}°C</p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
          {data.description} · 습도 {data.humidity}%
        </p>
      </>
    );
  }

  return (
    <>
      <p className="mt-2 text-2xl font-bold">{data.tempC}°C</p>
      <p className="text-sm text-muted-foreground">
        {data.description} · 체감 {data.feelsLikeC}°C
      </p>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5" />
          습도 {data.humidity}%
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3.5 w-3.5" />
          {data.windKmh}km/h
        </span>
      </div>
      {data.source === "fallback" && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          API 미설정 · 샘플 값
        </p>
      )}
    </>
  );
}

export function WeatherDisplayHeader({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h3
        className={
          compact
            ? "text-[11px] font-medium text-muted-foreground"
            : "text-sm font-semibold text-foreground"
        }
      >
        호치민 날씨
      </h3>
      <CloudSun
        className={
          compact ? "h-3.5 w-3.5 text-amber-500" : "h-5 w-5 text-amber-500"
        }
      />
    </div>
  );
}
