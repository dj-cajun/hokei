import type { PostTopic } from "@/generated/prisma/client";
import { log } from "@/lib/logger";
import type { RawNewsItem } from "@/lib/news/rss";
import {
  isNaverScraperAvailable,
  scrapeNaverNewsSearch,
} from "@/lib/news/naver-scrape";

type NaverNewsItem = {
  title?: string;
  originallink?: string;
  link?: string;
  description?: string;
  pubDate?: string;
};

type NaverNewsResponse = {
  items?: NaverNewsItem[];
  errorMessage?: string;
  errorCode?: string;
};

/** 네이버 뉴스 검색 API 응답 HTML/엔티티 정리 */
export function stripNaverHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNaverNewsConfigured(): boolean {
  return Boolean(
    process.env.NAVER_CLIENT_ID?.trim() &&
      process.env.NAVER_CLIENT_SECRET?.trim()
  );
}

export function isNaverNewsLink(url: string): boolean {
  return /naver\.com/i.test(url) && /news/i.test(url);
}

/** 네이버 뉴스 중계 URL (본문은 요약만 제공되는 경우) */
export function isNaverNewsAggregatorLink(url: string): boolean {
  return /n\.news\.naver\.com|news\.naver\.com\/article/i.test(url);
}

function parseNaverDate(raw?: string): Date {
  if (!raw) return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function mapApiItems(
  items: NaverNewsItem[],
  topic: PostTopic,
  sourceName: string
): RawNewsItem[] {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  return items
    .map((item) => {
      const title = stripNaverHtml(item.title ?? "").slice(0, 300);
      const description = stripNaverHtml(item.description ?? "").slice(0, 2000);
      const link = (item.originallink || item.link || "").trim();
      const publishedAt = parseNaverDate(item.pubDate);

      return {
        topic,
        title,
        description: description || title,
        link,
        sourceName,
        publishedAt,
      };
    })
    .filter(
      (item) =>
        item.title.length > 4 &&
        item.link.startsWith("http") &&
        item.publishedAt.getTime() >= cutoff
    );
}

async function fetchNaverNewsFromApi(
  query: string,
  topic: PostTopic,
  sourceName: string,
  maxPerQuery: number,
  clientId: string,
  clientSecret: string
): Promise<{ items: RawNewsItem[]; authFailed: boolean }> {
  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(Math.min(maxPerQuery, 10)));
  url.searchParams.set("sort", "date");

  try {
    const res = await fetch(url, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      const authFailed = res.status === 401 || err.includes("024");
      log("error", "[naver-api] request failed", {
        query,
        status: res.status,
        detail: err.slice(0, 200),
      });
      return { items: [], authFailed };
    }

    const data = (await res.json()) as NaverNewsResponse;
    if (data.errorCode) {
      log("error", "[naver-api] api error", {
        query,
        errorCode: data.errorCode,
        errorMessage: data.errorMessage,
      });
      return { items: [], authFailed: data.errorCode === "024" };
    }

    return {
      items: mapApiItems(data.items ?? [], topic, sourceName),
      authFailed: false,
    };
  } catch (error) {
    log("error", "[naver-api] exception", { query, error: String(error) });
    return { items: [], authFailed: false };
  }
}

export async function fetchNaverNewsItems(
  query: string,
  topic: PostTopic,
  sourceName: string,
  maxPerQuery = 5
): Promise<RawNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();

  if (clientId && clientSecret) {
    const { items, authFailed } = await fetchNaverNewsFromApi(
      query,
      topic,
      sourceName,
      maxPerQuery,
      clientId,
      clientSecret
    );
    if (items.length > 0) return items;
    if (!authFailed) return [];
    console.warn(`[naver] API 인증 실패 — Playwright 폴백 시도: ${query}`);
  } else {
    console.warn(
      "[naver] API 키 없음 — Playwright 폴백 시도 (설정 시 NAVER_CLIENT_ID/SECRET)"
    );
  }

  if (!(await isNaverScraperAvailable())) {
    console.warn(
      "[naver-scrape] Python Playwright 미설치. npm run news:scrape:setup"
    );
    return [];
  }

  return scrapeNaverNewsSearch(query, topic, sourceName, maxPerQuery);
}
