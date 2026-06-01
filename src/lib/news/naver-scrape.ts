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

export function isNaverScraperEnabled(): boolean {
  return process.env.NAVER_USE_SCRAPER !== "0";
}

let scraperDepsOk: boolean | null = null;

/** Playwright(Python) 설치 여부 — 로컬 수집용 */
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

export async function scrapeNaverNewsSearch(
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
    const parsed = JSON.parse(raw) as
      | { error?: string }
      | Array<{ title?: string; link?: string; description?: string; pubDate?: string }>;

    if (!Array.isArray(parsed)) {
      if (typeof parsed === "object" && parsed && "error" in parsed) {
        log("error", "[naver-scrape] search parse", {
          query,
          error: parsed.error,
        });
      }
      return [];
    }

    const cutoff = Date.now() - 48 * 60 * 60 * 1000;

    return parsed
      .map((item) => {
        const title = stripNaverHtml(item.title ?? "").slice(0, 300);
        const description = stripNaverHtml(
          item.description ?? item.title ?? ""
        ).slice(0, 2000);
        const link = (item.link ?? "").trim();
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        return {
          topic,
          title,
          description: description || title,
          link,
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
  } catch (error) {
    log("error", "[naver-scrape] search", { query, error: String(error) });
    return [];
  }
}
