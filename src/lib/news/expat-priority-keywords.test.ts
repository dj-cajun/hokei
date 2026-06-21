import { describe, expect, it } from "vitest";
import {
  matchesExpatPriorityNews,
  isExpatLowValueNews,
} from "@/lib/news/expat-priority-keywords";
import { passesTopicRelevanceFilter } from "@/lib/news/topic-relevance";

const DELETED_SAMPLES = [
  {
    n: 2,
    title: "[단독 인터뷰] 베트남 게임 콘트롤타워, 한국과 함께 가고 싶다",
    desc: "베트남 게임 산업과 한국 협력",
    link: "https://www.example.com/1",
    source: "네이버 뉴스",
    expectKeep: true,
  },
  {
    n: 6,
    title:
      "[베트남 송금 가계부] 환율 올라도 물가가 슥삭…쌀국수 1그릇 줄어드는 데 그쳐",
    desc: "호치민 생활비",
    link: "https://www.insidevina.com/news/articleView.html?idxno=1",
    source: "인사이드비나",
    expectKeep: true,
  },
  {
    n: 8,
    title: "선그룹, 한국 최대 여행 박람회 첫 참가",
    desc: "국내 여행 박람회",
    link: "https://www.mk.co.kr/1",
    source: "네이버 뉴스",
    expectKeep: false,
  },
  {
    n: 11,
    title: "베트남항공, '정시운항률' 대한항공 제치고 아시아 3위 올라…",
    desc: "베트남항공 운항",
    link: "https://www.insidevina.com/news/articleView.html?idxno=2",
    source: "인사이드비나",
    expectKeep: true,
  },
  {
    n: 13,
    title:
      "현대차, 베트남 1,024km 철도망 구축 위한 지하철 열차 건설 지원",
    desc: "베트남 인프라",
    link: "https://www.example.com/2",
    source: "네이버 뉴스",
    expectKeep: true,
  },
  {
    n: 15,
    title: "대한항공 글로벌 인재 육성부터 제주항공 취항 20주년",
    desc: "국내 항공 업계",
    link: "https://www.shinailbo.co.kr/1",
    source: "신아일보",
    expectKeep: false,
  },
] as const;

describe("deleted sample review", () => {
  for (const sample of DELETED_SAMPLES) {
    it(`#${sample.n} keep=${sample.expectKeep}`, () => {
      const ok = passesTopicRelevanceFilter(
        "KOREA",
        sample.title,
        sample.desc,
        { link: sample.link, sourceName: sample.source }
      );
      expect(ok).toBe(sample.expectKeep);
    });
  }
});

describe("matchesExpatPriorityNews", () => {
  it("detects remittance living costs", () => {
    expect(
      matchesExpatPriorityNews(
        "[베트남 송금 가계부] 환율 올라도 물가가 슥삭",
        "호치민"
      )
    ).toBe(true);
  });

  it("detects Korea-Vietnam game industry", () => {
    expect(
      matchesExpatPriorityNews(
        "베트남 게임 콘트롤타워, 한국과 함께",
        ""
      )
    ).toBe(true);
  });
});

describe("isExpatLowValueNews", () => {
  it("flags airline HR anniversary roundup", () => {
    expect(
      isExpatLowValueNews(
        "대한항공 글로벌 인재 육성부터 제주항공 취항 20주년",
        ""
      )
    ).toBe(true);
  });
});
