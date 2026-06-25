import { describe, expect, it } from "vitest";
import { isValidKakaoLink, normalizeKakaoLink } from "@/lib/kakao-link";

describe("kakao-link", () => {
  it("accepts pf.kakao channel chat links", () => {
    expect(
      isValidKakaoLink("https://pf.kakao.com/_xbxhTG/chat")
    ).toBe(true);
  });

  it("accepts open.kakao links", () => {
    expect(isValidKakaoLink("https://open.kakao.com/o/sABC123")).toBe(true);
  });

  it("rejects random URLs", () => {
    expect(isValidKakaoLink("https://example.com")).toBe(false);
    expect(isValidKakaoLink("javascript:alert(1)")).toBe(false);
  });

  it("normalize throws on invalid", () => {
    expect(() => normalizeKakaoLink("https://bad.link")).toThrow();
  });
});
