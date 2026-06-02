import { prisma } from "@/lib/prisma";
import { buildPostFromArticlePage } from "@/lib/news/ingest-article";
import { fetchNewsFromSource } from "@/lib/news/fetch-sources";
import { isNaverNewsConfigured } from "@/lib/news/naver-news";
import {
  isNaverRequestsScraperAvailable,
  isNaverScraperAvailable,
} from "@/lib/news/naver-scrape";
import { loadNewsTopicSourcesFromDb } from "@/lib/news/load-sources-config";
import { MAX_DAILY_NEWS } from "@/lib/news/sources";
import { VNEXPRESS_RSS_FALLBACK_FEEDS } from "@/lib/news/vnexpress-feeds";
import type { RawNewsItem } from "@/lib/news/rss";
import { passesTopicRelevanceFilter } from "@/lib/news/topic-relevance";
import { isMostlyKorean } from "@/lib/news/language";
import {
  areDuplicateNews,
  dedupeRawNewsItems,
} from "@/lib/news/dedupe";
import { sanitizeStoredSourceName } from "@/lib/news/source-display";
import { isVnExpressArticle } from "@/lib/news/vnexpress";
import type { PostTopic } from "@/generated/prisma/client";
import { indexPostInSearch } from "@/lib/search/index-post";

export type IngestResult = {
  inserted: number;
  skipped: number;
  errors: string[];
  items: { id: string; title: string; topic: PostTopic }[];
};

function hoChiMinhDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function hoChiMinhDayBounds(date: Date): { start: Date; end: Date } {
  const today = hoChiMinhDateKey(date);
  const start = new Date(`${today}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

async function countTodayIngested(): Promise<number> {
  const { start, end } = hoChiMinhDayBounds(new Date());
  return prisma.post.count({
    where: {
      isAutomated: true,
      ingestedAt: { gte: start, lt: end },
    },
  });
}

async function loadCategoryMap(): Promise<Map<string, string>> {
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ slug: "news" }, { slug: { startsWith: "news-" } }],
    },
    select: { slug: true, id: true },
  });
  return new Map(categories.map((c) => [c.slug, c.id]));
}

function pickBalanced(
  pool: RawNewsItem[],
  limit: number
): RawNewsItem[] {
  const byTopic = new Map<PostTopic, RawNewsItem[]>();
  for (const item of pool) {
    const list = byTopic.get(item.topic) ?? [];
    list.push(item);
    byTopic.set(item.topic, list);
  }

  for (const [, list] of byTopic) {
    list.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  const picked: RawNewsItem[] = [];
  const topics = [...byTopic.keys()];
  let round = 0;

  while (picked.length < limit && topics.some((t) => (byTopic.get(t)?.length ?? 0) > round)) {
    for (const topic of topics) {
      if (picked.length >= limit) break;
      const list = byTopic.get(topic);
      if (list && list[round]) picked.push(list[round]);
    }
    round++;
  }

  return picked.slice(0, limit);
}

export type IngestOptions = {
  /** Google 뉴스 삭제 후 전량 재수집 등 — 호치민 기준 일일 상한 무시 */
  ignoreDailyCap?: boolean;
  /** cron | admin:{userId} */
  triggeredBy?: string;
};

export async function ingestDailyNews(
  options?: IngestOptions
): Promise<IngestResult> {
  const startedAt = Date.now();
  const result: IngestResult = {
    inserted: 0,
    skipped: 0,
    errors: [],
    items: [],
  };

  const alreadyToday = await countTodayIngested();
  const remaining = options?.ignoreDailyCap
    ? MAX_DAILY_NEWS
    : Math.max(0, MAX_DAILY_NEWS - alreadyToday);

  if (remaining === 0) {
    result.errors.push(
      `오늘(호치민 기준) 이미 ${MAX_DAILY_NEWS}건 수집 완료 — 건너뜀`
    );
    return result;
  }

  const categoryMap = await loadCategoryMap();
  if (categoryMap.size === 0) {
    throw new Error("뉴스 카테고리가 없습니다. npm run db:seed:categories 실행");
  }

  const pool: RawNewsItem[] = [];

  const naverScraperOk =
    (await isNaverRequestsScraperAvailable()) ||
    (await isNaverScraperAvailable());
  if (!isNaverNewsConfigured() && !naverScraperOk) {
    result.errors.push(
      "네이버 API·스크래퍼 없음 — pip3 install -r scripts/python/requirements.txt 또는 NAVER_CLIENT_ID/SECRET 설정"
    );
  }

  const rssOnly = process.env.INGEST_RSS_ONLY === "1";
  const topicSources = await loadNewsTopicSourcesFromDb();

  for (const config of topicSources) {
    const feeds = rssOnly
      ? VNEXPRESS_RSS_FALLBACK_FEEDS[config.topic]
      : config.feeds;
    for (const feed of feeds) {
      const items = await fetchNewsFromSource(feed, config.topic, 4);
      const filtered = items.filter((item) =>
        passesTopicRelevanceFilter(item.topic, item.title, item.description, {
          link: item.link,
          sourceName: item.sourceName,
        })
      );
      pool.push(...filtered);
    }
  }

  const uniqueByLink = new Map<string, RawNewsItem>();
  for (const item of pool) {
    if (!uniqueByLink.has(item.link)) uniqueByLink.set(item.link, item);
  }

  const dedupedPool = dedupeRawNewsItems([...uniqueByLink.values()]);

  const existingPosts = await prisma.post.findMany({
    where: { isAutomated: true, status: "PUBLISHED" },
    select: { sourceUrl: true, title: true, content: true },
  });
  const existingSet = new Set(existingPosts.map((e) => e.sourceUrl));

  const candidates = dedupedPool
    .filter((item) => !existingSet.has(item.link))
    .filter(
      (item) =>
        !existingPosts.some((p) =>
          areDuplicateNews(
            { title: item.title, description: item.description },
            { title: p.title, content: p.content }
          )
        )
    )
    .sort((a, b) => {
      const aVne = isVnExpressArticle(a.link, a.title, a.sourceName) ? 2 : 0;
      const bVne = isVnExpressArticle(b.link, b.title, b.sourceName) ? 2 : 0;
      const aKo = isMostlyKorean(a.title) ? 1 : 0;
      const bKo = isMostlyKorean(b.title) ? 1 : 0;
      return (
        bVne - aVne ||
        bKo - aKo ||
        b.publishedAt.getTime() - a.publishedAt.getTime()
      );
    });

  const toProcess = pickBalanced(candidates, remaining);

  const knownNews = existingPosts.map((p) => ({
    title: p.title,
    content: p.content,
  }));

  for (const raw of toProcess) {
    const config = topicSources.find((c) => c.topic === raw.topic);
    const categoryId = categoryMap.get(config?.categorySlug ?? "");
    if (!categoryId) {
      result.skipped++;
      result.errors.push(`카테고리 없음: ${config?.categorySlug}`);
      continue;
    }

    try {
      const { title, content, thumbnail } =
        await buildPostFromArticlePage(raw);

      if (
        knownNews.some((p) =>
          areDuplicateNews({ title, content }, p)
        )
      ) {
        result.skipped++;
        continue;
      }

      const summaryText =
        (content ?? "").replace(/\s+/g, " ").trim().slice(0, 160) || title;

      const post = await prisma.post.create({
        data: {
          title,
          summary: summaryText,
          content,
          sourceUrl: raw.link,
          sourceName: sanitizeStoredSourceName(raw.sourceName),
          topic: raw.topic,
          categoryId,
          originalTitle: raw.title,
          thumbnail,
          publishedAt: raw.publishedAt,
          isAutomated: true,
          status: "PUBLISHED",
        },
      });

      await indexPostInSearch({
        id: post.id,
        title: post.title,
        summary: post.summary,
        content: post.content,
        status: post.status,
      });

      knownNews.push({ title, content });
      result.inserted++;
      result.items.push({ id: post.id, title: post.title, topic: raw.topic });
    } catch (err) {
      result.skipped++;
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${raw.link}: ${msg}`);
    }
  }

  const errorSlice = result.errors.slice(0, 50);
  await prisma.newsIngestRun.create({
    data: {
      inserted: result.inserted,
      skipped: result.skipped,
      errors:
        errorSlice.length > 0 ? errorSlice.join("\n") : null,
      errorDetails:
        errorSlice.length > 0
          ? JSON.stringify(
              errorSlice.map((message) => ({
                message,
                at: new Date().toISOString(),
              }))
            )
          : null,
      durationMs: Date.now() - startedAt,
      triggeredBy: options?.triggeredBy ?? null,
    },
  });

  return result;
}
