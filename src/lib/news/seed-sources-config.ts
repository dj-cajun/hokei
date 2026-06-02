import { prisma } from "@/lib/prisma";
import { NEWS_TOPIC_SOURCES } from "@/lib/news/sources";

/** 코드 마스터 → DB (기존 행은 유지, 없으면 추가) */
export async function syncNewsSourcesFromCode(): Promise<number> {
  let added = 0;
  let order = 0;

  for (const config of NEWS_TOPIC_SOURCES) {
    for (const feed of config.feeds) {
      order += 1;
      const existing = await prisma.newsSourceConfig.findFirst({
        where: {
          topic: config.topic,
          type: feed.type,
          ...(feed.type === "naver"
            ? { query: feed.query }
            : { url: feed.url }),
        },
      });
      if (existing) continue;

      await prisma.newsSourceConfig.create({
        data: {
          topic: config.topic,
          type: feed.type,
          query: feed.type === "naver" ? feed.query : null,
          url: feed.type === "rss" ? feed.url : null,
          sourceName: feed.sourceName,
          isEnabled: true,
          sortOrder: order,
        },
      });
      added += 1;
    }
  }

  return added;
}

export async function ensureNewsSourcesSeeded(): Promise<void> {
  const count = await prisma.newsSourceConfig.count();
  if (count === 0) {
    await syncNewsSourcesFromCode();
  }
}
