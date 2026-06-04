import { describe, expect, it } from "vitest";
import { pickByIngestMix } from "@/lib/news/ingest-mix";
import { ingestQuotas } from "@/lib/news/news-ingest-tier";
import type { RawNewsItem } from "@/lib/news/rss";

function item(
  partial: Partial<RawNewsItem> & Pick<RawNewsItem, "link" | "ingestTier">
): RawNewsItem {
  return {
    topic: "KOREA",
    title: partial.title ?? "제목",
    description: partial.description ?? "",
    link: partial.link,
    sourceName: partial.sourceName ?? "테스트",
    publishedAt: partial.publishedAt ?? new Date("2026-06-01T12:00:00Z"),
    ingestTier: partial.ingestTier,
  };
}

describe("ingestQuotas", () => {
  it("splits daily cap 15 by 20/30/30/20 ratio (floor + remainder)", () => {
    const q = ingestQuotas(15);
    expect(q.OFFICIAL + q.SAFETY_VISA + q.LIVING + q.GENERAL).toBe(15);
    expect(q.SAFETY_VISA).toBeGreaterThanOrEqual(q.GENERAL);
    expect(q.LIVING).toBeGreaterThanOrEqual(q.GENERAL);
  });
});

describe("pickByIngestMix", () => {
  it("respects tier quotas before filling remainder", () => {
    const pool = [
      ...Array.from({ length: 5 }, (_, i) =>
        item({ link: `official-${i}`, ingestTier: "OFFICIAL", sourceName: "KOTRA" })
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        item({ link: `safety-${i}`, ingestTier: "SAFETY_VISA" })
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        item({ link: `living-${i}`, ingestTier: "LIVING" })
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        item({ link: `general-${i}`, ingestTier: "GENERAL" })
      ),
    ];
    const limit = 15;
    const quotas = ingestQuotas(limit);
    const picked = pickByIngestMix(pool, limit);
    const counts = {
      OFFICIAL: picked.filter((p) => p.ingestTier === "OFFICIAL").length,
      SAFETY_VISA: picked.filter((p) => p.ingestTier === "SAFETY_VISA").length,
      LIVING: picked.filter((p) => p.ingestTier === "LIVING").length,
      GENERAL: picked.filter((p) => p.ingestTier === "GENERAL").length,
    };
    expect(counts.OFFICIAL).toBe(quotas.OFFICIAL);
    expect(counts.SAFETY_VISA).toBe(quotas.SAFETY_VISA);
    expect(counts.LIVING).toBe(quotas.LIVING);
    expect(counts.GENERAL).toBe(quotas.GENERAL);
    expect(picked).toHaveLength(limit);
  });

  it("detects official tier from source name when ingestTier missing", () => {
    const picked = pickByIngestMix(
      [
        item({
          link: "https://example.com/1",
          sourceName: "주베트남 한국대사관",
          ingestTier: undefined,
        }),
      ],
      3
    );
    expect(picked).toHaveLength(1);
  });
});
