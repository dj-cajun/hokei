import { VND_PER_KRW } from "@/lib/exchange";
import type { ExchangeSnapshot } from "@/lib/exchange/types";

type RateApiResponse = {
  rates?: { VND?: number };
  time_last_update_utc?: string;
};

export async function getExchangeRate(): Promise<ExchangeSnapshot> {
  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/KRW",
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return fallbackSnapshot();
    }

    const data = (await res.json()) as RateApiResponse;
    const vnd = data.rates?.VND;

    if (!vnd || !Number.isFinite(vnd)) {
      return fallbackSnapshot();
    }

    return {
      vndPerKrw: vnd,
      updatedAt: data.time_last_update_utc ?? new Date().toISOString(),
      source: "api",
    };
  } catch {
    return fallbackSnapshot();
  }
}

function fallbackSnapshot(): ExchangeSnapshot {
  return {
    vndPerKrw: VND_PER_KRW,
    updatedAt: new Date().toISOString(),
    source: "fallback",
  };
}
