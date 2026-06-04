import { describe, expect, it } from "vitest";
import { listNaverSearchQueries, naverFeedsForTopic } from "@/lib/news/naver-search-queries";

describe("naver-search-queries", () => {
  it("includes core Korea search terms (교민·진출·안전)", () => {
    const korea = listNaverSearchQueries().KOREA;
    expect(korea).toContain("베트남 교민");
    expect(korea).toContain("베트남 진출");
    expect(korea).toContain("베트남 안전");
  });

  it("includes expat and traveler focused queries per topic", () => {
    const lists = listNaverSearchQueries();
    expect(lists.KOREA.some((q) => /교민|한인|거주/.test(q))).toBe(true);
    expect(lists.TRAVEL.some((q) => /여행|항공/.test(q))).toBe(true);
    expect(lists.VIETNAM_POLICY.some((q) => /비자|체류|입국/.test(q))).toBe(true);
    expect(lists.TOURIST.some((q) => /관광|여행/.test(q))).toBe(true);
  });

  it("maps to naver feed sources", () => {
    const feeds = naverFeedsForTopic("KOREA");
    expect(feeds[0]?.type).toBe("naver");
    expect(feeds.every((f) => f.type === "naver")).toBe(true);
  });
});
