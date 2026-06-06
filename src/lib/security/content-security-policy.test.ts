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

  it("allows AdSense script and ad frames in production CSP", () => {
    const csp = buildContentSecurityPolicy(false);
    expect(csp).toContain("https://pagead2.googlesyndication.com");
    expect(csp).toContain("https://googleads.g.doubleclick.net");
  });

  it("allows YouTube embed in frame-src and child-src (not legacy Kakao-only policy)", () => {
    for (const isDev of [true, false]) {
      const csp = buildContentSecurityPolicy(isDev);
      expect(csp).toContain("https://www.youtube-nocookie.com");
      expect(csp).toContain("https://www.youtube.com");
      expect(csp).not.toContain("kauth.kakao.com");
      expect(csp).not.toContain("kakaocdn.net");
    }
  });
});
