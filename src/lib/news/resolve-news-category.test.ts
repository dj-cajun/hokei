import { describe, expect, it } from "vitest";
import { formatOutlinkCtaLabel } from "@/lib/admin/curate-outlink-metadata";
import {
  normalizeOutlinkCategorySlug,
  resolveNewsCategorySlug,
} from "@/lib/news/resolve-news-category";

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

  it("maps consulate keywords to news-consulate-association", () => {
    expect(
      resolveNewsCategorySlug({
        topic: "KOREA",
        title: "[총영사관] 호치민 교민 스캠 주의 당부",
        sourceName: "주호치민 대한민국 총영사관",
      })
    ).toBe("news-consulate-association");
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

describe("normalizeOutlinkCategorySlug", () => {
  it("maps community-survival-qa to consulate tab", () => {
    expect(normalizeOutlinkCategorySlug("community-survival-qa")).toBe(
      "news-consulate-association"
    );
  });
});

describe("formatOutlinkCtaLabel", () => {
  it("uses consulate label", () => {
    expect(formatOutlinkCtaLabel("주호치민 대한민국 총영사관")).toContain(
      "대사관"
    );
  });
});
