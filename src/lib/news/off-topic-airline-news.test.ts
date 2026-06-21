import { describe, expect, it } from "vitest";
import { isOffTopicAirlineIndustryNews } from "@/lib/news/off-topic-airline-news";
import { passesTopicRelevanceFilter } from "@/lib/news/topic-relevance";

describe("isOffTopicAirlineIndustryNews", () => {
  it("rejects Korean airline corporate roundup", () => {
    expect(
      isOffTopicAirlineIndustryNews(
        "(대한항공 글로벌 인재 육성부터 제주항공 취항 20주년)",
        "국내 항공 업계 동향"
      )
    ).toBe(true);
  });

  it("allows Vietnam route schedule news", () => {
    expect(
      isOffTopicAirlineIndustryNews(
        "대한항공, 인천-호치민 노선 주 14회로 증편",
        "베트남 노선 운항"
      )
    ).toBe(false);
  });

  it("allows airfare promo on Vietnam routes", () => {
    expect(
      isOffTopicAirlineIndustryNews(
        "제주항공 인천-다낭 편도 19만원 프로모션",
        "베트남 여행 특가"
      )
    ).toBe(false);
  });
});

describe("passesTopicRelevanceFilter airline industry", () => {
  it("rejects corporate airline news even with 베트남 in snippet", () => {
    expect(
      passesTopicRelevanceFilter(
        "TRAVEL",
        "(대한항공 글로벌 인재 육성부터 제주항공 취항 20주년)",
        "베트남 시장 성장세 속 국내 항공 업계 종합",
        { link: "https://www.shinailbo.co.kr/news/1.html" }
      )
    ).toBe(false);
  });
});
