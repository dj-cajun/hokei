import { describe, expect, it } from "vitest";
import { canonicalNewsArticleUrl } from "@/lib/news/article-url-canonical";

describe("canonicalNewsArticleUrl", () => {
  it("strips tracking params", () => {
    expect(
      canonicalNewsArticleUrl(
        "https://example.com/news/1?utm_source=fb&fbclid=abc"
      )
    ).toBe("https://example.com/news/1");
  });

  it("normalizes naver article ids", () => {
    expect(
      canonicalNewsArticleUrl(
        "https://news.naver.com/main/read.naver?mode=LSD&mid=shm&oid=001&aid=0001234567"
      )
    ).toBe("https://news.naver.com/main/read.naver?mode=LSD&mid=shm&oid=001&aid=0001234567");

    expect(
      canonicalNewsArticleUrl(
        "https://n.news.naver.com/mnews/article/001/0001234567?sid=101"
      )
    ).toBe("https://n.news.naver.com/mnews/article/001/0001234567");
  });

  it("keeps articleView idxno only", () => {
    expect(
      canonicalNewsArticleUrl(
        "https://www.insidevina.com/news/articleView.html?idxno=43378&foo=bar"
      )
    ).toBe(
      "https://www.insidevina.com/news/articleView.html?idxno=43378"
    );
  });
});
