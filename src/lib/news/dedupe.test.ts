import { describe, expect, it } from "vitest";
import {
  areDuplicateNews,
  dedupeRawNewsItems,
  stripNewsTitleForDedup,
  titlesAreSimilar,
} from "@/lib/news/dedupe";

describe("stripNewsTitleForDedup", () => {
  it("removes bracket prefix and source suffix", () => {
    expect(
      stripNewsTitleForDedup("[베트남] 다낭 한인회 행사… - 연합뉴스")
    ).toBe("다낭 한인회 행사");
  });
});

describe("titlesAreSimilar", () => {
  it("matches paraphrased headlines", () => {
    expect(
      titlesAreSimilar(
        "다낭 한인회, 지역 봉사 행사 개최",
        "다낭 한인회 지역 봉사 행사를 열다"
      )
    ).toBe(true);
  });
});

describe("areDuplicateNews", () => {
  it("detects same story with different headlines via description", () => {
    const body =
      "베트남 다낭시 한인회가 지역 사회를 위한 봉사 행사를 성황리에 마쳤다. 참가자들은 현지 복지 시설을 방문해 물품을 전달했다.";

    expect(
      areDuplicateNews(
        {
          title: "다낭 한인회 봉사 행사",
          description: body,
        },
        {
          title: "[인사이드비나] 다낭 한인회, 지역 봉사활동 실시",
          content: body,
        }
      )
    ).toBe(true);
  });

  it("detects identical RSS summaries from syndication", () => {
    const summary =
      "하노이 거주 한국인들을 대상으로 비자 연장 안내 설명회가 열렸다. 현지 출입국 관련 절차와 필요 서류를 안내했다.";

    expect(
      areDuplicateNews(
        { title: "하노이 한인 비자 설명회", description: summary },
        { title: "하노이 교민 비자 안내 행사 개최", description: summary }
      )
    ).toBe(true);
  });
});

describe("dedupeRawNewsItems", () => {
  it("keeps richer duplicate in pool", () => {
    const short = {
      title: "하노이 한인 행사",
      description: "짧은 요약",
    };
    const long = {
      title: "하노이 한인 행사",
      description:
        "하노이 거주 한국인 커뮤니티가 주최한 행사가 열렸다. 현지 교민들이 참석해 교류 시간을 가졌다.",
    };

    const out = dedupeRawNewsItems([short, long]);
    expect(out).toHaveLength(1);
    expect(out[0]?.description).toBe(long.description);
  });
});
