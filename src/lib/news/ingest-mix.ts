import type { RawNewsItem } from "@/lib/news/rss";
import {
  type NewsIngestTier,
  DEFAULT_TIER_BY_TOPIC,
  ingestQuotas,
} from "@/lib/news/news-ingest-tier";
import { isOfficialNoticeSource } from "@/lib/news/official-notice-feeds";

function resolveTier(item: RawNewsItem): NewsIngestTier {
  if (item.ingestTier) return item.ingestTier;
  if (isOfficialNoticeSource(item.sourceName, item.link)) return "OFFICIAL";
  return DEFAULT_TIER_BY_TOPIC[item.topic];
}

function sortPool(list: RawNewsItem[]): RawNewsItem[] {
  return [...list].sort((a, b) => {
    const aOfficial = isOfficialNoticeSource(a.sourceName, a.link) ? 1 : 0;
    const bOfficial = isOfficialNoticeSource(b.sourceName, b.link) ? 1 : 0;
    if (bOfficial !== aOfficial) return bOfficial - aOfficial;
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });
}

/**
 * 일일 상한을 [공지 20% · 안전/비자 30% · 생활 30% · 일반 20%] 비율로 채움
 */
export function pickByIngestMix(
  pool: RawNewsItem[],
  limit: number
): RawNewsItem[] {
  const quotas = ingestQuotas(limit);
  const byTier = new Map<NewsIngestTier, RawNewsItem[]>();

  for (const item of pool) {
    const tier = resolveTier(item);
    const list = byTier.get(tier) ?? [];
    list.push(item);
    byTier.set(tier, list);
  }

  for (const [tier, list] of byTier) {
    byTier.set(tier, sortPool(list));
  }

  const picked: RawNewsItem[] = [];
  const tiers: NewsIngestTier[] = [
    "OFFICIAL",
    "SAFETY_VISA",
    "LIVING",
    "GENERAL",
  ];

  for (const tier of tiers) {
    const cap = quotas[tier];
    const list = byTier.get(tier) ?? [];
    picked.push(...list.slice(0, cap));
  }

  if (picked.length >= limit) return picked.slice(0, limit);

  const pickedLinks = new Set(picked.map((p) => p.link));
  const remainder = sortPool(pool.filter((p) => !pickedLinks.has(p.link)));
  for (const item of remainder) {
    if (picked.length >= limit) break;
    picked.push(item);
  }

  return picked;
}
