import { afterEach, describe, expect, it, vi } from "vitest";
import { isDatabaseAvailable } from "@/lib/database-available";

describe("isDatabaseAvailable", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows sqlite in CI even when VERCEL=1", () => {
    vi.stubEnv("DATABASE_URL", "file:./ci-e2e.db");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "true");
    expect(isDatabaseAvailable()).toBe(true);
  });

  it("blocks sqlite on Vercel runtime without CI", () => {
    vi.stubEnv("DATABASE_URL", "file:./dev.db");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("CI", "");
    expect(isDatabaseAvailable()).toBe(false);
  });
});
