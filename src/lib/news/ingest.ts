import { prisma } from "@/lib/prisma";
import { buildPostFromArticlePage } from "@/lib/news/ingest-article";
import { fetchNewsFromSource } from "@/lib/news/fetch-sources";
import {
  resolveIngestRssOnly,
} from "@/lib/news/ingest-runtime";
import { loadNewsTopicSourcesFromDb } from "@/lib/news/load-sources-config";
import { MAX_DAILY_NEWS } from "@/lib/news/sources";
import { VNEXPRESS_RSS_FALLBACK_FEEDS } from "@/lib/news/vnexpress-feeds";
import type { RawNewsItem } from "@/lib/news/rss";
import { pickByIngestMix } from "@/lib/news/ingest-mix";
import { passesTopicRelevanceFilter } from "@/lib/news/topic-relevance";
import { isMostlyKorean } from "@/lib/news/language";
import {
  areDuplicateNews,
  dedupeRawNewsItems,
} from "@/lib/news/dedupe";
import { sanitizeStoredSourceName } from "@/lib/news/source-display";
import { isVnExpressArticle } from "@/lib/news/vnexpress";
import { isVietnamKoreanMediaArticle } from "@/lib/news/vietnam-korean-media";
import type { PostTopic } from "@/generated/prisma/client";
import { hasSubstantialNewsBody } from "@/lib/news/news-body-quality";
import { pruneEmptyContentAutomatedNews } from "@/lib/news/prune-empty-content-news";
import { resolveNewsCategorySlug } from "@/lib/news/resolve-news-category";
import { indexPostInSearch } from "@/lib/search/index-post";
import {
  computeBodyAttemptBudget,
  getIngestFetchTimeoutMs,
  isBodyPhasePastDeadline,
  isVercelRuntime,
  VERCEL_BODY_PHASE_DEADLINE_MS,
} from "@/lib/news/ingest-budget";

export type IngestResult = {
  inserted: number;
  skipped: number;
  /** 본문 없음(썸네일만) 기존 자동 뉴스 삭제 건수 */
  prunedEmpty: number;
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
    prunedEmpty: 0,
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
    try {
      await prisma.newsIngestRun.create({
        data: {
          inserted: 0,
          skipped: 0,
          errors: result.errors.join("\n"),
          durationMs: Date.now() - startedAt,
          triggeredBy: options?.triggeredBy ?? null,
        },
      });
    } catch {
      /* 수집 스킵 기록 실패는 무시 */
    }
    return result;
  }

  const categoryMap = await loadCategoryMap();
  if (categoryMap.size === 0) {
    throw new Error("뉴스 카테고리가 없습니다. npm run db:seed:categories 실행");
  }

  const pool: RawNewsItem[] = [];

  const { rssOnly, naverConfigured, naverScraperOk, reason: rssReason } =
    await resolveIngestRssOnly();
  if (!naverConfigured && !naverScraperOk) {
    result.errors.push(
      rssOnly
        ? `네이버 없음 → RSS 모드 (${rssReason})`
        : "네이버 API·스크래퍼 없음 — NAVER_CLIENT_ID/SECRET 또는 INGEST_RSS_ONLY=1"
    );
  }

  const onVercel = isVercelRuntime();
  const topicSources = await loadNewsTopicSourcesFromDb();
  const maxPerFeed = onVercel ? 5 : 8;

  async function collectFromFeeds(useRssOnly: boolean) {
    const batch: RawNewsItem[] = [];
    for (const config of topicSources) {
      const feeds = useRssOnly
        ? VNEXPRESS_RSS_FALLBACK_FEEDS[config.topic]
        : config.feeds;
      for (const feed of feeds) {
        const items = await fetchNewsFromSource(feed, config.topic, maxPerFeed);
        const filtered = items.filter((item) =>
          passesTopicRelevanceFilter(item.topic, item.title, item.description, {
            link: item.link,
            sourceName: item.sourceName,
          })
        );
        batch.push(...filtered);
      }
    }
    return batch;
  }

  pool.push(...(await collectFromFeeds(rssOnly)));

  // 네이버 키는 있으나 401 등으로 풀이 비면 RSS로 재시도 (Vercel 이중 0건 방지)
  if (!rssOnly && pool.length < 5) {
    result.errors.push(
      `소스 풀 부족(${pool.length}) → RSS 폴백 재수집`
    );
    pool.push(...(await collectFromFeeds(true)));
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
      const score = (item: RawNewsItem) => {
        if (isVnExpressArticle(item.link, item.title, item.sourceName)) return 3;
        if (
          isVietnamKoreanMediaArticle(
            item.link,
            item.title,
            item.sourceName
          )
        ) {
          return 2;
        }
        return isMostlyKorean(item.title) ? 1 : 0;
      };
      return (
        score(b) - score(a) ||
        b.publishedAt.getTime() - a.publishedAt.getTime()
      );
    });

  const attemptBudget = computeBodyAttemptBudget(
    candidates.length,
    remaining,
    onVercel
  );
  const toProcess = pickByIngestMix(candidates, attemptBudget);

  const knownNews = existingPosts.map((p) => ({
    title: p.title,
    content: p.content,
  }));

  const bodyPhaseStartedAt = Date.now();
  const fetchTimeoutMs = getIngestFetchTimeoutMs();
  let bodyAttempts = 0;

  for (const raw of toProcess) {
    if (result.inserted >= remaining) break;

    if (isBodyPhasePastDeadline(bodyPhaseStartedAt, Date.now(), onVercel)) {
      result.errors.push(
        `[ingest] cron deadline (${VERCEL_BODY_PHASE_DEADLINE_MS}ms) — 본문 추출 중단 (시도 ${bodyAttempts}/${toProcess.length})`
      );
      break;
    }

    bodyAttempts++;
    try {
      const { title, content, thumbnail, bodySkip } =
        await buildPostFromArticlePage(raw, { fetchTimeoutMs });

      if (!hasSubstantialNewsBody(content)) {
        result.skipped++;
        const reason = bodySkip?.reason ?? "no_body";
        const chars = bodySkip?.chars ?? (content ?? "").replace(/\s+/g, "").trim().length;
        const detail = bodySkip?.detail ? ` (${bodySkip.detail})` : "";
        result.errors.push(
          `${raw.link}: [${reason}] 본문 ${chars}자${detail} — 저장 안 함`
        );
        continue;
      }

      const summaryText =
        (content ?? "").replace(/\s+/g, " ").trim().slice(0, 160) || title;

      const categorySlug = resolveNewsCategorySlug({
        topic: raw.topic,
        title,
        summary: summaryText,
        sourceName: raw.sourceName,
      });
      const categoryId =
        categoryMap.get(categorySlug) ?? categoryMap.get("news");
      if (!categoryId) {
        result.skipped++;
        result.errors.push(`카테고리 없음: ${categorySlug}`);
        continue;
      }

      if (
        knownNews.some((p) =>
          areDuplicateNews({ title, content }, p)
        )
      ) {
        result.skipped++;
        continue;
      }

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

  const prune = await pruneEmptyContentAutomatedNews();
  result.prunedEmpty = prune.removed;

  const ingestMeta = {
    poolSize: dedupedPool.length,
    candidates: candidates.length,
    attempted: bodyAttempts,
    attemptBudget,
    remainingQuota: remaining,
    maxPerFeed,
    fetchTimeoutMs,
    bodyPhaseDeadlineMs: onVercel ? VERCEL_BODY_PHASE_DEADLINE_MS : null,
  };
  result.errors.unshift(
    `[ingest] pool=${ingestMeta.poolSize} candidates=${ingestMeta.candidates} attempt=${ingestMeta.attempted} quota=${ingestMeta.remainingQuota}`
  );

  const errorSlice = result.errors.slice(0, 50);
  try {
    await prisma.newsIngestRun.create({
      data: {
        inserted: result.inserted,
        skipped: result.skipped,
        errors:
          errorSlice.length > 0 ? errorSlice.join("\n") : null,
        errorDetails: JSON.stringify({
          meta: { ...ingestMeta, rssOnly, rssReason },
          issues: errorSlice
            .filter((m) => !m.startsWith("[ingest]"))
            .map((message) => ({
              message,
              at: new Date().toISOString(),
            })),
        }),
        durationMs: Date.now() - startedAt,
        triggeredBy: options?.triggeredBy ?? null,
      },
    });
  } catch (logErr) {
    const msg = logErr instanceof Error ? logErr.message : String(logErr);
    result.errors.push(`NewsIngestRun 기록 실패(수집 결과는 유지): ${msg}`);
  }

  return result;
}
