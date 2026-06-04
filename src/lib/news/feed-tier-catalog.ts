import type { NewsIngestTier } from "@/lib/news/news-ingest-tier";
import type { NewsFeedSource } from "@/lib/news/sources";
import { NEWS_TOPIC_SOURCES } from "@/lib/news/sources";

function feedKey(feed: NewsFeedSource): string {
  return feed.type === "naver" ? `naver:${feed.query}` : `rss:${feed.url}`;
}

let lookupCache: Map<string, NewsIngestTier> | null = null;

export function getFeedTierLookup(): Map<string, NewsIngestTier> {
  if (lookupCache) return lookupCache;
  lookupCache = new Map();
  for (const config of NEWS_TOPIC_SOURCES) {
    for (const feed of config.feeds) {
      if (feed.tier) lookupCache.set(feedKey(feed), feed.tier);
    }
  }
  return lookupCache;
}

export function resolveFeedTier(feed: NewsFeedSource): NewsIngestTier | undefined {
  return getFeedTierLookup().get(feedKey(feed));
}
