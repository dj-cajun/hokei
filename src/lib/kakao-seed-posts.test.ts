import { describe, expect, it } from "vitest";
import {
  buildSeedSourceUrl,
  expandTimelineStores,
  mapSeedRegion,
  parsePublishedAtFromDate,
  parsePublishedAtFromSourceKey,
} from "../../prisma/seed-kakao-posts";
import type { KakaoSeedTimelineStore } from "../../prisma/seed-kakao-posts";

describe("kakao seed posts", () => {
  it("maps region aliases to DB slugs", () => {
    expect(mapSeedRegion("D7")).toBe("district-7");
    expect(mapSeedRegion("HANOI")).toBe("hanoi");
    expect(mapSeedRegion("BHTAN")).toBe("binh-thanh");
    expect(mapSeedRegion("BINHTHAN")).toBe("binh-thanh");
    expect(mapSeedRegion("D9")).toBe("district-9");
  });

  it("builds community vs ai-curate sourceUrl prefixes", () => {
    const key = "kakaotalk:hoc-room:20260506-0835";
    expect(buildSeedSourceUrl("community-survival-qa", key)).toBe(
      `hokei:community:${key}`
    );
    expect(buildSeedSourceUrl("jobs-hiring", key)).toBe(
      `hokei:ai-curate:${key}`
    );
  });

  it("parses publishedAt from source key timestamp", () => {
    const date = parsePublishedAtFromSourceKey(
      "kakaotalk:hoc-room:20260504-1834"
    );
    expect(date.toISOString()).toContain("2026-05-04");
  });

  it("expands promo timeline stores into post rows", () => {
    const stores: KakaoSeedTimelineStore[] = [
      {
        storeName: "막둥이네짬뽕",
        categorySlug: "promo-store-hungry",
        region: "D2",
        timelineUpdates: [
          {
            date: "2026-06-03",
            title: "오픈 안내",
            body: "2군 타오디엔 정식 오픈",
          },
        ],
      },
    ];
    const rows = expandTimelineStores(stores);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.storeName).toBe("막둥이네짬뽕");
    expect(rows[0]?.publishedAtDate).toBe("2026-06-03");
    expect(rows[0]?.sourceKey).toContain("timeline");
  });
});
