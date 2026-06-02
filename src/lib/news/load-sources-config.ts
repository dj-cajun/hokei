import type { PostTopic } from "@/generated/prisma/client";
import {
  NEWS_TOPIC_SOURCES,
  type NewsTopicConfig,
  TOPIC_LABELS,
} from "@/lib/news/sources";
import type { NewsFeedSource } from "@/lib/news/sources";
import { ensureNewsSourcesSeeded } from "@/lib/news/seed-sources-config";
import { prisma } from "@/lib/prisma";

const TOPIC_CATEGORY_SLUG: Record<PostTopic, string> = {
  KOREA: "news",
  TRAVEL: "news",
  VIETNAM_POLICY: "news-visa-residency",
  TOURIST: "news",
};

export async function loadNewsTopicSourcesFromDb(): Promise<NewsTopicConfig[]> {
  await ensureNewsSourcesSeeded();

  const rows = await prisma.newsSourceConfig.findMany({
    where: { isEnabled: true },
    orderBy: [{ topic: "asc" }, { sortOrder: "asc" }],
  });

  if (rows.length === 0) return NEWS_TOPIC_SOURCES;

  const byTopic = new Map<PostTopic, NewsFeedSource[]>();
  for (const row of rows) {
    const list = byTopic.get(row.topic) ?? [];
    if (row.type === "naver" && row.query) {
      list.push({
        type: "naver",
        query: row.query,
        sourceName: row.sourceName,
      });
    } else if (row.type === "rss" && row.url) {
      list.push({
        type: "rss",
        url: row.url,
        sourceName: row.sourceName,
      });
    }
    byTopic.set(row.topic, list);
  }

  const topics = [...byTopic.keys()];
  return topics.map((topic) => ({
    topic,
    label: TOPIC_LABELS[topic],
    categorySlug: TOPIC_CATEGORY_SLUG[topic],
    feeds: byTopic.get(topic) ?? [],
  }));
}
