import { describe, expect, it } from "vitest";
import { resolveNewsCategorySlug } from "@/lib/news/resolve-news-category";

describe("resolveNewsCategorySlug", () => {
  it("maps visa keywords to news-visa-residency", () => {
    expect(
      resolveNewsCategorySlug({
        topic: "TRAVEL",
        title: "베트남 7월부터 검역 대폭 강화, 입국자 건강신고 의무화",
      })
    ).toBe("news-visa-residency");
  });

  it("maps education keywords to news-international-school", () => {
    expect(
      resolveNewsCategorySlug({
        topic: "KOREA",
        title: "호치민 7군 국제학교 입학 설명회 개최",
      })
    ).toBe("news-international-school");
  });

  it("maps column keywords to news-column-opinion", () => {
    expect(
      resolveNewsCategorySlug({
        topic: "KOREA",
        title: "[칼럼] 호치민에서 창업한 한 달",
      })
    ).toBe("news-column-opinion");
  });

  it("falls back to topic default", () => {
    expect(
      resolveNewsCategorySlug({
        topic: "TOURIST",
        title: "다낭 해변 리조트 특가 프로모션",
      })
    ).toBe("news");
  });
});
