import { describe, expect, it } from "vitest";
import {
  RATE_LIMIT_PRESETS,
  checkRateLimit,
  peekRateLimit,
  recordRateLimitFailure,
} from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const key = `test-${Date.now()}-allow`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("blocks when limit exceeded", () => {
    const key = `test-${Date.now()}-block`;
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("defines DM rate limit presets", () => {
    expect(RATE_LIMIT_PRESETS.dmCreate.maxRequests).toBe(10);
    expect(RATE_LIMIT_PRESETS.dmSend.maxRequests).toBe(30);
  });

  it("peek does not increment count", () => {
    const key = `test-${Date.now()}-peek`;
    expect(peekRateLimit(key, 2, 60_000)).toBe(true);
    expect(peekRateLimit(key, 2, 60_000)).toBe(true);
    recordRateLimitFailure(key, 2, 60_000);
    expect(peekRateLimit(key, 2, 60_000)).toBe(true);
    recordRateLimitFailure(key, 2, 60_000);
    expect(peekRateLimit(key, 2, 60_000)).toBe(false);
  });
});
