import { describe, expect, it } from "vitest";
import { decodeKakaoOAuthState, encodeKakaoOAuthState } from "@/lib/auth/kakao-state";

describe("kakao OAuth state", () => {
  it("returns undefined for home path", () => {
    expect(encodeKakaoOAuthState("/")).toBeUndefined();
    expect(encodeKakaoOAuthState("")).toBeUndefined();
  });

  it("round-trips callback path via base64url", () => {
    const encoded = encodeKakaoOAuthState("/community");
    expect(encoded).toBeTruthy();
    expect(encoded).not.toContain("/");
    expect(decodeKakaoOAuthState(encoded)).toBe("/community");
  });

  it("round-trips path with query", () => {
    const path = "/write?section=jobs";
    const encoded = encodeKakaoOAuthState(path);
    expect(decodeKakaoOAuthState(encoded)).toBe(path);
  });

  it("decodes legacy percent-encoded state", () => {
    expect(decodeKakaoOAuthState("%2Fcommunity")).toBe("/community");
  });
});
