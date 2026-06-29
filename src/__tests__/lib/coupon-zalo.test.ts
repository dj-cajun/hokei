import { describe, it, expect } from "vitest";
import { couponPageUrl, isZaloInAppBrowser, zaloShareUrl } from "@/lib/coupon/zalo";

describe("zalo helpers", () => {
  it("detects Zalo user agent", () => {
    expect(isZaloInAppBrowser("Mozilla/5.0 Zalo iOS")).toBe(true);
    expect(isZaloInAppBrowser("Mozilla/5.0 Chrome")).toBe(false);
  });

  it("builds share URL", () => {
    const url = zaloShareUrl("https://www.hokei.vn/store/2d-sketch-cafe/coupon");
    expect(url).toContain("button-share.zalo.me");
    expect(url).toContain(encodeURIComponent("https://www.hokei.vn/store/2d-sketch-cafe/coupon"));
  });

  it("builds coupon page URL", () => {
    expect(couponPageUrl("https://www.hokei.vn", "2d-sketch-cafe")).toBe(
      "https://www.hokei.vn/store/2d-sketch-cafe/coupon",
    );
  });
});
