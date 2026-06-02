import { describe, expect, it } from "vitest";
import {
  hasViewCookieInHeader,
  viewCookieName,
} from "@/lib/post-view-cookie";

describe("post-view-cookie", () => {
  it("viewCookieName은 글 ID를 포함한다", () => {
    expect(viewCookieName("abc-123")).toBe("hokei_pv_abc-123");
  });

  it("쿠키가 없으면 false", () => {
    expect(hasViewCookieInHeader(null, viewCookieName("x"))).toBe(false);
    expect(hasViewCookieInHeader("", viewCookieName("x"))).toBe(false);
  });

  it("동일 글 조회수 쿠키가 있으면 true", () => {
    const name = viewCookieName("post-1");
    expect(
      hasViewCookieInHeader(`${name}=1; other=2`, name)
    ).toBe(true);
    expect(hasViewCookieInHeader(`pref=0; ${name}=1`, name)).toBe(true);
  });

  it("다른 글 쿠키는 매칭하지 않는다", () => {
    const a = viewCookieName("a");
    const b = viewCookieName("b");
    expect(hasViewCookieInHeader(`${a}=1`, b)).toBe(false);
  });
});
