import { CloudSun, Droplets, Wind } from "lucide-react";

export function WeatherWidget() {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">호치민 날씨</h3>
        <CloudSun className="h-5 w-5 text-amber-500" />
      </div>
      <p className="mt-2 text-2xl font-bold">32°C</p>
      <p className="text-sm text-muted-foreground">맑음 · 체감 36°C</p>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5" />
          습도 72%
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3.5 w-3.5" />
          12km/h
        </span>
      </div>
    </div>
  );
}
