import { describe, expect, it } from "vitest";
import { mapsEmbedSrc } from "@/lib/partner/maps-embed";

describe("mapsEmbedSrc", () => {
  it("주소로 embed URL 생성", () => {
    expect(mapsEmbedSrc("74 Nguyễn Cư Trinh", null)).toContain(
      "maps.google.com/maps?q="
    );
  });

  it("가짜 google 호스트는 거부", () => {
    expect(
      mapsEmbedSrc(null, "https://evil-google.com?q=foo")
    ).toBeNull();
  });

  it("google maps q 파라미터만 추출", () => {
    const src = mapsEmbedSrc(
      null,
      "https://www.google.com/maps?q=Ho+Chi+Minh"
    );
    expect(src).toContain("maps.google.com/maps?q=Ho%20Chi%20Minh");
  });
});
