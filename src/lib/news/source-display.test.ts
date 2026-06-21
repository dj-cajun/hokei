import { describe, expect, it } from "vitest";
import { formatPostSourceAttribution } from "@/lib/news/source-display";

describe("formatPostSourceAttribution", () => {
  it("shows stored publisher name", () => {
    expect(formatPostSourceAttribution("라오동신문", "https://ko.laodong.vn/a.ldo")).toBe(
      "라오동신문"
    );
  });

  it("strips 네이버 prefix from source name", () => {
    expect(
      formatPostSourceAttribution(
        "네이버 · 인사이드비나",
        "https://www.insidevina.com/a.html"
      )
    ).toBe("인사이드비나");
  });

  it("derives publisher from URL when source name is empty", () => {
    expect(
      formatPostSourceAttribution(
        null,
        "https://ko.laodong.vn/giao-duc/sample.ldo"
      )
    ).toBe("라오동신문");
  });

  it("derives insidevina from URL", () => {
    expect(
      formatPostSourceAttribution(
        null,
        "https://www.insidevina.com/news/articleView.html?idxno=1"
      )
    ).toBe("인사이드비나");
  });

  it("falls back to hostname for unknown sites", () => {
    expect(
      formatPostSourceAttribution(null, "https://www.chosun.com/article/1")
    ).toBe("chosun");
  });
});
