import { describe, expect, it } from "vitest";
import {
  isOffTopicRegionalKoreaNews,
  isRegionalKoreaNewsSource,
} from "@/lib/news/off-topic-regional-korea-news";
import { passesTopicRelevanceFilter } from "@/lib/news/topic-relevance";

describe("isRegionalKoreaNewsSource", () => {
  it("detects 도민일보 in source name", () => {
    expect(isRegionalKoreaNewsSource("경북도민일보")).toBe(true);
    expect(isRegionalKoreaNewsSource("전남도민일보")).toBe(true);
  });

  it("detects publisher suffix in title", () => {
    expect(
      isRegionalKoreaNewsSource(
        "네이버 뉴스",
        "https://n.news.naver.com/mnews/article/001/1",
        "경주시, 베트남 관광 유치 - 경북도민일보"
      )
    ).toBe(true);
  });

  it("ignores national papers", () => {
    expect(isRegionalKoreaNewsSource("조선일보")).toBe(false);
    expect(isRegionalKoreaNewsSource("연합뉴스")).toBe(false);
  });
});

describe("isOffTopicRegionalKoreaNews", () => {
  it("blocks Gyeongju inbound tourism from regional paper", () => {
    const title =
      "경주시, 베트남 기업 인센티브 관광시장 첫 성과...150명 단체 유치 - 경북도민일보";
    expect(
      isOffTopicRegionalKoreaNews(title, "베트남 관광객 유치", {
        sourceName: "경북도민일보",
        link: "https://www.idomin.com/news/articleView.html?idxno=1",
      })
    ).toBe(true);
  });

  it("allows regional paper when expat living in Vietnam", () => {
    expect(
      isOffTopicRegionalKoreaNews(
        "호치민 교민, 송금·물가 부담 호소",
        "베트남 거주",
        { sourceName: "경북도민일보" }
      )
    ).toBe(false);
  });

  it("blocks local gov headline with Vietnam inbound without expat signal", () => {
    expect(
      isOffTopicRegionalKoreaNews(
        "부산시, 베트남 관광객 10만명 유치 목표",
        "관광시장",
        { sourceName: "연합뉴스" }
      )
    ).toBe(true);
  });
});

describe("passesTopicRelevanceFilter regional", () => {
  it("rejects Gyeongju regional tourism via TOURIST topic", () => {
    expect(
      passesTopicRelevanceFilter(
        "TOURIST",
        "경주시, 베트남 기업 인센티브 관광시장 첫 성과...150명 단체 유치",
        "베트남 관광객",
        {
          sourceName: "경북도민일보",
          link: "https://www.idomin.com/news/articleView.html?idxno=1",
        }
      )
    ).toBe(false);
  });
});
