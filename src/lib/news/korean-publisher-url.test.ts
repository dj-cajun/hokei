import { describe, expect, it } from "vitest";
import {
  isKoreanPublisherArticleUrl,
  toKoreanPublisherArticleUrl,
} from "@/lib/news/korean-publisher-url";

describe("toKoreanPublisherArticleUrl", () => {
  it("adds /ko/ prefix for vietnam.vn", () => {
    expect(
      toKoreanPublisherArticleUrl(
        "https://www.vietnam.vn/abc-news-123.html"
      )
    ).toBe("https://www.vietnam.vn/ko/abc-news-123.html");
  });

  it("keeps existing /ko/ path", () => {
    const url = "https://www.vietnam.vn/ko/sample-article";
    expect(toKoreanPublisherArticleUrl(url)).toBe(url);
  });

  it("leaves insidevina unchanged", () => {
    const url =
      "https://www.insidevina.com/news/articleView.html?idxno=1";
    expect(toKoreanPublisherArticleUrl(url)).toBe(url);
  });

  it("rewrites laodong.vn to ko.laodong.vn", () => {
    expect(
      toKoreanPublisherArticleUrl(
        "https://laodong.vn/sample-article-123.ldo"
      )
    ).toBe("https://ko.laodong.vn/sample-article-123.ldo");
  });

  it("keeps ko.laodong.vn unchanged", () => {
    const url =
      "https://ko.laodong.vn/giao-duc/sample-1722550.ldo";
    expect(toKoreanPublisherArticleUrl(url)).toBe(url);
  });
});

describe("isKoreanPublisherArticleUrl", () => {
  it("accepts vietnam.vn ko paths", () => {
    expect(
      isKoreanPublisherArticleUrl("https://www.vietnam.vn/ko/foo")
    ).toBe(true);
  });

  it("rejects vietnam.vn without ko", () => {
    expect(
      isKoreanPublisherArticleUrl("https://www.vietnam.vn/en/foo")
    ).toBe(false);
  });

  it("accepts ko.laodong.vn", () => {
    expect(
      isKoreanPublisherArticleUrl(
        "https://ko.laodong.vn/giao-duc/sample.ldo"
      )
    ).toBe(true);
  });
});
