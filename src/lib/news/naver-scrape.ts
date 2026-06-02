import { spawn } from "node:child_process";
import path from "node:path";
import type { PostTopic } from "@/generated/prisma/client";
import { log } from "@/lib/logger";
import type { RawNewsItem } from "@/lib/news/rss";
import { stripNaverHtml } from "@/lib/news/naver-news";

const PYTHON_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "scripts",
  "python"
);

export type NaverScrapedArticle = {
  title: string;
  content: string;
  img?: string | null;
};

export type NaverSearchScrapeRow = {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
};

function runPython(script: string, args: string[]): Promise<string> {
  const python = process.env.PYTHON_PATH?.trim() || "python3";
  const scriptPath = path.join(PYTHON_DIR, script);

  return new Promise((resolve, reject) => {
    const proc = spawn(python, [scriptPath, ...args], {
      cwd: process.cwd(),
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    proc.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `python exit ${code}`));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function parseSearchJson(raw: string): NaverSearchScrapeRow[] | { error: string } {
  const parsed = JSON.parse(raw) as
    | { error?: string }
    | Array<{
        title?: string;
        link?: string;
        description?: string;
        pubDate?: string;
      }>;

  if (!Array.isArray(parsed)) {
    const err =
      typeof parsed === "object" && parsed && "error" in parsed
        ? String(parsed.error)
        : "invalid json";
    return { error: err };
  }
  return parsed
    .map((item) => ({
      title: (item.title ?? "").trim(),
      link: (item.link ?? "").trim(),
      description: (item.description ?? item.title ?? "").trim(),
      pubDate: item.pubDate,
    }))
    .filter((item) => item.title.length > 4 && item.link.startsWith("http"));
}

function mapRowsToRawNews(
  rows: NaverSearchScrapeRow[],
  topic: PostTopic,
  sourceName: string
): RawNewsItem[] {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;

  return rows
    .map((item) => {
      const title = stripNaverHtml(item.title).slice(0, 300);
      const description = stripNaverHtml(
        item.description ?? item.title
      ).slice(0, 2000);
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      return {
        topic,
        title,
        description: description || title,
        link: item.link,
        sourceName,
        publishedAt: Number.isNaN(publishedAt.getTime())
          ? new Date()
          : publishedAt,
      };
    })
    .filter(
      (item) =>
        item.title.length > 4 &&
        item.link.startsWith("http") &&
        item.publishedAt.getTime() >= cutoff
    );
}

export function isNaverScraperEnabled(): boolean {
  return process.env.NAVER_USE_SCRAPER !== "0";
}

let requestsDepsOk: boolean | null = null;
let scraperDepsOk: boolean | null = null;

/** requests + beautifulsoup4 */
export async function isNaverRequestsScraperAvailable(): Promise<boolean> {
  if (!isNaverScraperEnabled()) return false;
  if (requestsDepsOk !== null) return requestsDepsOk;

  const python = process.env.PYTHON_PATH?.trim() || "python3";
  requestsDepsOk = await new Promise((resolve) => {
    const proc = spawn(
      python,
      ["-c", "import requests; from bs4 import BeautifulSoup"],
      { cwd: process.cwd() }
    );
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
  return requestsDepsOk ?? false;
}

/** Playwright(Python) 설치 여부 */
export async function isNaverScraperAvailable(): Promise<boolean> {
  if (!isNaverScraperEnabled()) return false;
  if (scraperDepsOk !== null) return scraperDepsOk;

  const python = process.env.PYTHON_PATH?.trim() || "python3";
  scraperDepsOk = await new Promise((resolve) => {
    const proc = spawn(
      python,
      ["-c", "import playwright; import playwright_stealth"],
      { cwd: process.cwd() }
    );
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
  return scraperDepsOk ?? false;
}

/** requests 기반 네이버 뉴스 검색 (빠른 1차) */
export async function scrapeNaverNewsSearchRequests(
  query: string,
  topic: PostTopic,
  sourceName: string,
  maxPerQuery = 5
): Promise<RawNewsItem[]> {
  try {
    const raw = await runPython("naver_scrape.py", [
      query,
      String(Math.min(maxPerQuery, 8)),
    ]);
    const parsed = parseSearchJson(raw);
    if ("error" in parsed) {
      log("warn", "[naver-scrape] requests", { query, error: parsed.error });
      return [];
    }
    return mapRowsToRawNews(parsed, topic, sourceName);
  } catch (error) {
    log("error", "[naver-scrape] requests", { query, error: String(error) });
    return [];
  }
}

/** Playwright 기반 네이버 뉴스 검색 (2차) */
export async function scrapeNaverNewsSearchPlaywright(
  query: string,
  topic: PostTopic,
  sourceName: string,
  maxPerQuery = 5
): Promise<RawNewsItem[]> {
  try {
    const raw = await runPython("scrape_naver_search.py", [
      query,
      String(Math.min(maxPerQuery, 8)),
    ]);
    const parsed = parseSearchJson(raw);
    if ("error" in parsed) {
      log("error", "[naver-scrape] playwright", {
        query,
        error: parsed.error,
      });
      return [];
    }
    return mapRowsToRawNews(parsed, topic, sourceName);
  } catch (error) {
    log("error", "[naver-scrape] playwright", { query, error: String(error) });
    return [];
  }
}

/** API 라우트·수집 공통: requests → Playwright */
export async function scrapeNaverNewsSearch(
  query: string,
  topic: PostTopic = "KOREA",
  sourceName = "네이버 뉴스",
  maxPerQuery = 5
): Promise<RawNewsItem[]> {
  if (await isNaverRequestsScraperAvailable()) {
    const fast = await scrapeNaverNewsSearchRequests(
      query,
      topic,
      sourceName,
      maxPerQuery
    );
    if (fast.length > 0) return fast;
  }

  if (await isNaverScraperAvailable()) {
    return scrapeNaverNewsSearchPlaywright(
      query,
      topic,
      sourceName,
      maxPerQuery
    );
  }

  return [];
}

/** JSON 미리보기용 (DB topic 없이) */
export async function fetchNaverNewsSearchPreview(
  query: string,
  maxPerQuery = 5
): Promise<NaverSearchScrapeRow[]> {
  const items = await scrapeNaverNewsSearch(
    query,
    "KOREA",
    "네이버 뉴스",
    maxPerQuery
  );
  return items.map((item) => ({
    title: item.title,
    link: item.link,
    description: item.description,
    pubDate: item.publishedAt.toISOString(),
  }));
}

/** 기사 원문 URL — 제목·본문·이미지 (네이버/언론사 공통) */
export async function scrapeArticleFromUrl(
  url: string
): Promise<NaverScrapedArticle | null> {
  try {
    const raw = await runPython("scrape_article.py", [url]);
    const data = JSON.parse(raw) as NaverScrapedArticle & { error?: string };
    if (data.error) return null;
    const content = (data.content ?? "").trim();
    const title = (data.title ?? "").trim();
    if (content.length < 80 && title.length < 4) return null;
    return {
      title,
      content,
      img: data.img ?? undefined,
    };
  } catch (error) {
    log("error", "[naver-scrape] article", { url, error: String(error) });
    return null;
  }
}

export async function scrapeNaverNewsArticle(
  url: string
): Promise<NaverScrapedArticle | null> {
  return scrapeArticleFromUrl(url);
}
