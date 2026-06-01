import type { PostTopic } from "@/generated/prisma/client";
import { fetchNaverNewsItems } from "@/lib/news/naver-news";
import { fetchFeedItems, type RawNewsItem } from "@/lib/news/rss";
import type { NewsFeedSource } from "@/lib/news/sources";

export async function fetchNewsFromSource(
  feed: NewsFeedSource,
  topic: PostTopic,
  maxPerFeed = 4
): Promise<RawNewsItem[]> {
  if (feed.type === "naver") {
    return fetchNaverNewsItems(feed.query, topic, feed.sourceName, maxPerFeed);
  }
  return fetchFeedItems(feed.url, topic, feed.sourceName, maxPerFeed);
}
