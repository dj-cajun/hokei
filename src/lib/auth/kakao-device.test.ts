import { describe, expect, it } from "vitest";
import { shouldPreferKakaoTalk } from "@/lib/auth/kakao-device";

describe("shouldPreferKakaoTalk", () => {
  it("returns false on desktop", () => {
    expect(
      shouldPreferKakaoTalk(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120.0.0.0"
      )
    ).toBe(false);
  });

  it("returns true on mobile safari", () => {
    expect(
      shouldPreferKakaoTalk(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148"
      )
    ).toBe(true);
  });

  it("returns false in KakaoTalk in-app browser", () => {
    expect(
      shouldPreferKakaoTalk(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) KAKAOTALK"
      )
    ).toBe(false);
  });
});
