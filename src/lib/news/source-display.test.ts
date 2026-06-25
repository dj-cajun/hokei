import { describe, expect, it } from "vitest";
import {
  formatPostSourceAttribution,
  sanitizeNewsPostTitle,
} from "@/lib/news/source-display";

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
    ).toBe("조선일보");
  });

  it("uses URL publisher when source name is generic 뉴스", () => {
    expect(
      formatPostSourceAttribution(
        "네이버 뉴스",
        "https://www.shinailbo.co.kr/news/article.html"
      )
    ).toBe("신아일보");
  });
});

describe("sanitizeNewsPostTitle", () => {
  it("strips insidevina suffix from scraped title", () => {
    expect(
      sanitizeNewsPostTitle(
        "[베트남 송금 가계부] 환율 올라도 물가가 슥삭… - 인사이드비나",
        {
          sourceUrl: "https://www.insidevina.com/news/articleView.html?idxno=1",
        }
      )
    ).toBe("[베트남 송금 가계부] 환율 올라도 물가가 슥삭…");
  });

  it("strips national paper suffix", () => {
    expect(
      sanitizeNewsPostTitle("호치민 한인회 행사 개최 | 조선일보")
    ).toBe("호치민 한인회 행사 개최");
  });

  it("leaves title unchanged when no publisher suffix", () => {
    expect(sanitizeNewsPostTitle("베트남항공 정시운항률 상승")).toBe(
      "베트남항공 정시운항률 상승"
    );
  });
});
