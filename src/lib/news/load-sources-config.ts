import type { PostTopic } from "@/generated/prisma/client";
import {
  NEWS_TOPIC_SOURCES,
  type NewsTopicConfig,
  TOPIC_LABELS,
} from "@/lib/news/sources";
import { resolveFeedTier } from "@/lib/news/feed-tier-catalog";
import type { NewsFeedSource } from "@/lib/news/sources";
import { ensureNewsSourcesSeeded } from "@/lib/news/seed-sources-config";
import { prisma } from "@/lib/prisma";

import { DEFAULT_TOPIC_CATEGORY_SLUG } from "@/lib/news/resolve-news-category";

export async function loadNewsTopicSourcesFromDb(): Promise<NewsTopicConfig[]> {
  let rows: Awaited<
    ReturnType<typeof prisma.newsSourceConfig.findMany>
  > = [];

  try {
    await ensureNewsSourcesSeeded();
    rows = await prisma.newsSourceConfig.findMany({
      where: { isEnabled: true },
      orderBy: [{ topic: "asc" }, { sortOrder: "asc" }],
    });
  } catch {
    return NEWS_TOPIC_SOURCES;
  }

  if (rows.length === 0) return NEWS_TOPIC_SOURCES;

  const byTopic = new Map<PostTopic, NewsFeedSource[]>();
  for (const row of rows) {
    const list = byTopic.get(row.topic) ?? [];
    if (row.type === "naver" && row.query) {
      const feed: NewsFeedSource = {
        type: "naver",
        query: row.query,
        sourceName: row.sourceName,
      };
      list.push({ ...feed, tier: resolveFeedTier(feed) });
    } else if (row.type === "rss" && row.url) {
      const feed: NewsFeedSource = {
        type: "rss",
        url: row.url,
        sourceName: row.sourceName,
      };
      list.push({ ...feed, tier: resolveFeedTier(feed) });
    }
    byTopic.set(row.topic, list);
  }

  const topics = [...byTopic.keys()];
  return topics.map((topic) => ({
    topic,
    label: TOPIC_LABELS[topic],
    categorySlug: DEFAULT_TOPIC_CATEGORY_SLUG[topic],
    feeds: byTopic.get(topic) ?? [],
  }));
}
