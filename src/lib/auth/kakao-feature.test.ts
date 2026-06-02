import { afterEach, describe, expect, it, vi } from "vitest";
import { isKakaoLoginEnabled } from "@/lib/auth/kakao-feature";

describe("isKakaoLoginEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is false by default", () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_LOGIN_ENABLED", undefined);
    expect(isKakaoLoginEnabled()).toBe(false);
  });

  it("is true when env is true", () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_LOGIN_ENABLED", "true");
    expect(isKakaoLoginEnabled()).toBe(true);
  });
});
