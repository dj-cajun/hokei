import { describe, expect, it, vi } from "vitest";
import {
  formatDailyCapLabel,
  getMaxDailyNews,
  getPerRunIngestQuota,
  isDailyNewsCapEnabled,
} from "@/lib/news/daily-cap";

describe("daily-cap", () => {
  it("defaults to unlimited when NEWS_DAILY_CAP unset", () => {
    vi.stubEnv("NEWS_DAILY_CAP", "");
    expect(getMaxDailyNews()).toBeNull();
    expect(isDailyNewsCapEnabled()).toBe(false);
    expect(formatDailyCapLabel()).toBe("무제한");
  });

  it("treats 0 as unlimited", () => {
    vi.stubEnv("NEWS_DAILY_CAP", "0");
    expect(getMaxDailyNews()).toBeNull();
  });

  it("parses positive cap", () => {
    vi.stubEnv("NEWS_DAILY_CAP", "15");
    expect(getMaxDailyNews()).toBe(15);
    expect(formatDailyCapLabel()).toBe("15건/일");
  });

  it("uses per-run quota on Vercel", () => {
    vi.stubEnv("NEWS_PER_RUN_CAP", "");
    expect(getPerRunIngestQuota(true)).toBe(10);
  });

  it("respects NEWS_PER_RUN_CAP locally", () => {
    vi.stubEnv("NEWS_PER_RUN_CAP", "25");
    expect(getPerRunIngestQuota(false)).toBe(25);
  });
});
