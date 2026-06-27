import { describe, expect, it, vi } from "vitest";
import { getGoogleSiteVerification } from "./site-verification";

describe("getGoogleSiteVerification", () => {
  it("returns undefined when unset", () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "");
    expect(getGoogleSiteVerification()).toBeUndefined();
  });

  it("returns trimmed token", () => {
    vi.stubEnv("GOOGLE_SITE_VERIFICATION", "  abc123xyz  ");
    expect(getGoogleSiteVerification()).toBe("abc123xyz");
  });
});
