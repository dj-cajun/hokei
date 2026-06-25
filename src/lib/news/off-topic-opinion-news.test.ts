import { describe, expect, it } from "vitest";
import { isOffTopicOpinionNews } from "@/lib/news/off-topic-opinion-news";

describe("isOffTopicOpinionNews", () => {
  it("rejects [시론] editorials", () => {
    expect(
      isOffTopicOpinionNews(
        "[시론] 체코 두코바니 원전 수주 1년…",
        "원전 산업 전망"
      )
    ).toBe(true);
  });

  it("keeps regular Vietnam news", () => {
    expect(
      isOffTopicOpinionNews(
        "호치민 한인회, 교민 안전 캠페인 개최",
        "베트남 거주 한국인"
      )
    ).toBe(false);
  });
});
