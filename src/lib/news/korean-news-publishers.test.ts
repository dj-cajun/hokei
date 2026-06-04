import { describe, expect, it } from "vitest";
import { isKoreanPublisherArticleLink } from "@/lib/news/korean-news-publishers";

describe("isKoreanPublisherArticleLink", () => {
  it("detects major Korean news domains", () => {
    expect(
      isKoreanPublisherArticleLink("https://www.chosun.com/article/1")
    ).toBe(true);
    expect(
      isKoreanPublisherArticleLink("https://n.news.naver.com/article/1")
    ).toBe(true);
  });

  it("rejects unrelated domains", () => {
    expect(isKoreanPublisherArticleLink("https://vnexpress.net/a")).toBe(
      false
    );
  });
});
