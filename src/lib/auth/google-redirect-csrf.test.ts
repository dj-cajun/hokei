import { describe, expect, it } from "vitest";
import { verifyGoogleRedirectCsrf } from "@/lib/auth/google-redirect-csrf";

describe("verifyGoogleRedirectCsrf", () => {
  it("accepts matching cookie and body token", () => {
    expect(
      verifyGoogleRedirectCsrf("g_csrf_token=abc123; path=/", "abc123")
    ).toBe(true);
  });

  it("rejects mismatch", () => {
    expect(verifyGoogleRedirectCsrf("g_csrf_token=abc", "xyz")).toBe(false);
  });
});
