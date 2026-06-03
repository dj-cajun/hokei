import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveSiteUrl } from "@/lib/site-url";

describe("resolveSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back when NEXT_PUBLIC_SITE_URL is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "hokei-peach.vercel.app");
    expect(resolveSiteUrl()).toBe("https://hokei-peach.vercel.app");
  });

  it("uses trimmed NEXT_PUBLIC_SITE_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hokei-peach.vercel.app/");
    expect(resolveSiteUrl()).toBe("https://hokei-peach.vercel.app");
  });

  it("defaults to localhost when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(resolveSiteUrl()).toBe("http://localhost:3001");
  });
});
