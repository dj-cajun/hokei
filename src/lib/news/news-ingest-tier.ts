import type { PostTopic } from "@/generated/prisma/client";

/** 일일 수집 비율 — 공지 20% · 안전/비자 30% · 생활 30% · 일반 20% */
export type NewsIngestTier = "OFFICIAL" | "SAFETY_VISA" | "LIVING" | "GENERAL";

export const INGEST_MIX_RATIO: Record<NewsIngestTier, number> = {
  OFFICIAL: 0.2,
  SAFETY_VISA: 0.3,
  LIVING: 0.3,
  GENERAL: 0.2,
};

/** 토픽 → 기본 수집 티어 (피드에 tier 없을 때) */
export const DEFAULT_TIER_BY_TOPIC: Record<PostTopic, NewsIngestTier> = {
  KOREA: "GENERAL",
  TRAVEL: "GENERAL",
  VIETNAM_POLICY: "SAFETY_VISA",
  TOURIST: "LIVING",
};

export function ingestQuotas(
  dailyCap: number
): Record<NewsIngestTier, number> {
  const tiers = Object.keys(INGEST_MIX_RATIO) as NewsIngestTier[];
  const raw = tiers.map((t) => ({
    tier: t,
    count: Math.floor(dailyCap * INGEST_MIX_RATIO[t]),
  }));
  let assigned = raw.reduce((s, r) => s + r.count, 0);
  let i = 0;
  while (assigned < dailyCap) {
    raw[i % raw.length].count += 1;
    assigned += 1;
    i += 1;
  }
  return Object.fromEntries(raw.map((r) => [r.tier, r.count])) as Record<
    NewsIngestTier,
    number
  >;
}
