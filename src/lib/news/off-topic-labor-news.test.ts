import { describe, expect, it } from "vitest";
import { isOffTopicLaborNews } from "@/lib/news/off-topic-labor-news";
import { passesTopicRelevanceFilter } from "@/lib/news/topic-relevance";

describe("isOffTopicLaborNews", () => {
  it("detects 이주노동자", () => {
    expect(
      isOffTopicLaborNews("이주노동자 보호 정책 발표", "정부 대책")
    ).toBe(true);
  });

  it("detects 노동자 in title", () => {
    expect(
      isOffTopicLaborNews(
        "노동자들은 무료 법률 상담을 받을 때 권리를 이해합니다",
        ""
      )
    ).toBe(true);
  });

  it("allows 노동허가 (expat work permit)", () => {
    expect(isOffTopicLaborNews("베트남 노동허가 연장 안내", "교민 체류")).toBe(
      false
    );
  });
});

describe("passesTopicRelevanceFilter labor exclusion", () => {
  it("rejects labor worker news", () => {
    expect(
      passesTopicRelevanceFilter(
        "VIETNAM_POLICY",
        "외국인 노동자 권리 보호 강화",
        "호치민 산업단지",
        { link: "https://ko.laodong.vn/sample.ldo" }
      )
    ).toBe(false);
  });
});
