import { describe, expect, it } from "vitest";
import {
  buildKakaoRedirectUri,
  getKakaoRedirectUri,
  KAKAO_CALLBACK_PATH,
} from "@/lib/auth/kakao-redirect-uri";

describe("kakao redirect uri", () => {
  it("builds callback path", () => {
    expect(buildKakaoRedirectUri("https://hokei-peach.vercel.app")).toBe(
      `https://hokei-peach.vercel.app${KAKAO_CALLBACK_PATH}`
    );
  });

  it("server uses request origin over env when provided", () => {
    expect(getKakaoRedirectUri("http://192.168.0.5:3001")).toBe(
      `http://192.168.0.5:3001${KAKAO_CALLBACK_PATH}`
    );
  });
});
