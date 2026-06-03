import { describe, expect, it } from "vitest";
import { passesTopicRelevanceFilter } from "@/lib/news/topic-relevance";

describe("passesTopicRelevanceFilter", () => {
  it("KOREA accepts expat community news in Vietnam", () => {
    expect(
      passesTopicRelevanceFilter(
        "KOREA",
        "호치민 한인회, 교민 안전 캠페인 개최",
        "베트남 거주 한국인"
      )
    ).toBe(true);
  });

  it("TRAVEL requires Korean traveler angle", () => {
    expect(
      passesTopicRelevanceFilter(
        "TRAVEL",
        "한국인 호치민 여행 급증",
        "대한항공 증편"
      )
    ).toBe(true);
    expect(
      passesTopicRelevanceFilter("TRAVEL", "호치민 관광 명소 TOP5", "")
    ).toBe(false);
  });

  it("TOURIST allows local tourism without Korean keyword", () => {
    expect(
      passesTopicRelevanceFilter(
        "TOURIST",
        "호치민 야시장 관광 코스 추천",
        "베트남 여행지"
      )
    ).toBe(true);
  });

  it("rejects off-topic US diaspora", () => {
    expect(
      passesTopicRelevanceFilter("KOREA", "뉴저지 한인 축제", "미국 교민")
    ).toBe(false);
  });
});
