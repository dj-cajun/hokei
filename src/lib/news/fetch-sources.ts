import type { PostTopic } from "@/generated/prisma/client";
import { fetchNaverNewsItems } from "@/lib/news/naver-news";
import {
  fetchLaodongKoSitemapItems,
  LAODONG_KO_SITEMAP_URL,
} from "@/lib/news/laodong-ko-feed";
import { fetchFeedItems, type RawNewsItem } from "@/lib/news/rss";
import type { NewsFeedSource } from "@/lib/news/sources";

export async function fetchNewsFromSource(
  feed: NewsFeedSource,
  topic: PostTopic,
  maxPerFeed = 4
): Promise<RawNewsItem[]> {
  const tier = feed.tier;
  if (feed.type === "naver") {
    const items = await fetchNaverNewsItems(
      feed.query,
      topic,
      feed.sourceName,
      maxPerFeed
    );
    return items.map((item) => ({ ...item, ingestTier: tier ?? item.ingestTier }));
  }
  if (feed.type === "rss" && feed.url === LAODONG_KO_SITEMAP_URL) {
    return fetchLaodongKoSitemapItems(
      topic,
      feed.sourceName,
      maxPerFeed,
      tier
    );
  }
  return fetchFeedItems(
    feed.url,
    topic,
    feed.sourceName,
    maxPerFeed,
    tier
  );
}
