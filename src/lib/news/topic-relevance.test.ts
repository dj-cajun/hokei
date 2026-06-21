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

  it("accepts other media via naver/origin link when Vietnam + Korean diaspora", () => {
    expect(
      passesTopicRelevanceFilter(
        "KOREA",
        "호치민 한인회, 교민 안전 캠페인",
        "베트남 거주 한국인",
        {
          link: "https://www.chosun.com/article/123",
          sourceName: "네이버 뉴스",
        }
      )
    ).toBe(true);
  });

  it("does not bypass filter using feed sourceName VnExpress alone", () => {
    expect(
      passesTopicRelevanceFilter(
        "KOREA",
        "뉴저지 한인 축제",
        "미국 교민 커뮤니티",
        {
          link: "https://www.chosun.com/us-festival",
          sourceName: "VnExpress",
        }
      )
    ).toBe(false);
  });

  it("accepts Vietnamese keywords (한국인·투자·안전)", () => {
    expect(
      passesTopicRelevanceFilter(
        "KOREA",
        "Người Hàn Quốc tại TP.HCM tăng đầu tư",
        "Đầu tư bất động sản"
      )
    ).toBe(true);
    expect(
      passesTopicRelevanceFilter(
        "VIETNAM_POLICY",
        "An ninh cho người nước ngoài tại Việt Nam",
        "visa nhập cảnh"
      )
    ).toBe(true);
  });

  it("rejects domestic weekly airline promo roundup", () => {
    expect(
      passesTopicRelevanceFilter(
        "TRAVEL",
        "[하늘길] 6월 4주, 여름휴가 국제선 프로모션…파라타 외 2가지 항공",
        "파라타항공 베트남 노선 할인, 티웨이항공 진에어 프로모션",
        { link: "https://www.shinailbo.co.kr/news/article.html" }
      )
    ).toBe(false);
  });

  it("accepts real VnExpress article by URL", () => {
    expect(
      passesTopicRelevanceFilter(
        "VIETNAM_POLICY",
        "Vietnam visa rules for foreign workers",
        "Ho Chi Minh immigration",
        {
          link: "https://vnexpress.net/article-1",
          sourceName: "네이버 뉴스",
        }
      )
    ).toBe(true);
  });
});
