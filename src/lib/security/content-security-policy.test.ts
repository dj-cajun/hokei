import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy } from "@/lib/security/content-security-policy";

describe("buildContentSecurityPolicy", () => {
  it("allows Google GIS stylesheet in dev and prod", () => {
    for (const isDev of [true, false]) {
      const csp = buildContentSecurityPolicy(isDev);
      expect(csp).toContain("style-src 'self' 'unsafe-inline' https://accounts.google.com");
      expect(csp).toContain("style-src-elem 'self' 'unsafe-inline' https://accounts.google.com");
    }
  });
});
