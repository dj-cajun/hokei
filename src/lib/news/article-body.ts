import { cleanArticleBody } from "@/lib/news/article-body-clean";
import { decodeHtmlEntities } from "@/lib/news/decode-html-entities";
import { parseOgImageFromHtml } from "@/lib/news/image";
import { isHttpOrHttpsUrl } from "@/lib/news/image-url";
import { log } from "@/lib/logger";
import { getIngestFetchTimeoutMs } from "@/lib/news/ingest-budget";
import { extractTextWithCheerio } from "@/lib/news/article-body-cheerio";
import { fetchArticleBodyViaJinaReader } from "@/lib/news/article-body-jina";
import { isNaverScraperAvailable, scrapeArticleFromUrl } from "@/lib/news/naver-scrape";

const USER_AGENT =
  "Mozilla/5.0 (compatible; HokeiNewsBot/1.0; +https://hokei.vn)";
const MIN_BODY_LENGTH = 80;

export type ArticleBodyResult = {
  title: string;
  content: string;
  img?: string | null;
  source: "playwright" | "html" | "jina";
};

/** 본문 추출 실패 사유 — ingest·로그 공통 */
export type ArticleBodySkipReason =
  | "invalid_url"
  | "playwright_short"
  | "fetch_http"
  | "fetch_timeout"
  | "regex_short"
  | "extract_short"
  | "fetch_error";

export type ArticleBodySkip = {
  reason: ArticleBodySkipReason;
  detail?: string;
  chars?: number;
};

export type FetchArticleBodyOptions = {
  fetchTimeoutMs?: number;
};

export type FetchArticleBodyResult = {
  article: ArticleBodyResult | null;
  skip?: ArticleBodySkip;
};

function logBodySkip(url: string, skip: ArticleBodySkip): void {
  log("warn", "article-body skip", {
    url,
    reason: skip.reason,
    detail: skip.detail,
    chars: skip.chars,
  });
}

function stripNoiseFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<video[\s\S]*?<\/video>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<figcaption[\s\S]*?<\/figcaption>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(
      /<div[^>]+class=["'][^"']*(?:media_end_linked|relation_news|related_news|tag_group|fck_related|end_photo_org|media_end_summary|journalist|byline|art_subtit|sub_tit)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      ""
    )
    .replace(/<em[^>]+class=["'][^"']*img_desc[^"']*["'][^>]*>[\s\S]*?<\/em>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "");
}

function stripHtmlToText(html: string): string {
  return decodeHtmlEntities(
    stripNoiseFromHtml(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractFirst(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]) {
      const text = stripHtmlToText(m[1]);
      if (text.length >= MIN_BODY_LENGTH) return text;
    }
  }
  return "";
}

function extractTitleFromHtml(html: string): string {
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m?.[1]) {
      const t = stripHtmlToText(m[1]).slice(0, 300);
      if (t.length > 4) return t;
    }
  }
  return "";
}

/** fetch + HTML 정규식 파싱 (Playwright 불가 시) */
async function fetchArticleBodyFromHtml(
  url: string,
  fetchTimeoutMs: number
): Promise<FetchArticleBodyResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!res.ok) {
      const skip: ArticleBodySkip = {
        reason: "fetch_http",
        detail: String(res.status),
      };
      logBodySkip(url, skip);
      return { article: null, skip };
    }

    const html = (await res.text()).slice(0, 500_000);

    const bodyPatterns = [
      /<div[^>]+id=["']articleViewCon["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*article-view-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+id=["']dic_area["'][^>]*>([\s\S]*?)<\/div>/i,
      /<article[^>]+id=["']dic_area["'][^>]*>([\s\S]*?)<\/article>/i,
      /<div[^>]+id=["']article-view-content-div["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+id=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+class=["'][^"']*fck_detail[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]+itemprop=["']articleBody["'][^>]*>([\s\S]*?)<\/div>/i,
      /<article[^>]+class=["'][^"']*fck_detail[^"']*["'][^>]*>([\s\S]*?)<\/article>/i,
    ];

    const extracted = extractFirst(html, bodyPatterns);
    let content = cleanArticleBody(extracted);

    if (content.length < MIN_BODY_LENGTH) {
      const fromCheerio = extractTextWithCheerio(html, url);
      if (fromCheerio.length > content.length) {
        content = fromCheerio;
      }
    }

    if (content.length < MIN_BODY_LENGTH) {
      const skip: ArticleBodySkip = {
        reason: "extract_short",
        chars: content.length,
      };
      logBodySkip(url, skip);
      return { article: null, skip };
    }

    const title = extractTitleFromHtml(html);
    const img = parseOgImageFromHtml(html.slice(0, 200_000)) ?? null;
    return {
      article: {
        title,
        content: content.slice(0, 15_000),
        img,
        source: "html",
      },
    };
  } catch (error) {
    const isAbort =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"));
    const skip: ArticleBodySkip = {
      reason: isAbort ? "fetch_timeout" : "fetch_error",
      detail: error instanceof Error ? error.message : String(error),
    };
    logBodySkip(url, skip);
    return { article: null, skip };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 기사 원문 URL에서 본문만 추출 (검색 API 요약문 사용 안 함)
 * 1) Playwright 2) HTML fetch + 정규식 + cheerio
 */
export async function fetchArticleBody(
  url: string,
  options?: FetchArticleBodyOptions
): Promise<FetchArticleBodyResult> {
  const fetchTimeoutMs = options?.fetchTimeoutMs ?? getIngestFetchTimeoutMs();
  if (!isHttpOrHttpsUrl(url)) {
    const skip: ArticleBodySkip = { reason: "invalid_url" };
    logBodySkip(url, skip);
    return { article: null, skip };
  }

  if (await isNaverScraperAvailable()) {
    const scraped = await scrapeArticleFromUrl(url);
    const cleaned = cleanArticleBody(scraped?.content ?? "");
    if (cleaned.length >= MIN_BODY_LENGTH) {
      return {
        article: {
          title: scraped?.title?.trim() ?? "",
          content: cleaned.slice(0, 15_000),
          img: scraped?.img,
          source: "playwright",
        },
      };
    }
    if (scraped?.content) {
      const skip: ArticleBodySkip = {
        reason: "playwright_short",
        chars: cleaned.length,
      };
      logBodySkip(url, skip);
    }
  }

  const htmlResult = await fetchArticleBodyFromHtml(url, fetchTimeoutMs);
  if (htmlResult.article) return htmlResult;

  const jina = await fetchArticleBodyViaJinaReader(url, fetchTimeoutMs);
  if (jina) {
    return {
      article: {
        title: jina.title,
        content: jina.content,
        img: jina.img,
        source: "jina",
      },
    };
  }

  return htmlResult;
}

/** 본문이 제목과 어느 정도 관련 있는지 (완화된 휴리스틱) */
export function isBodyLikelyMatchingTitle(
  title: string,
  content: string
): boolean {
  const t = title.replace(/\s+/g, "").slice(0, 40);
  const c = content.replace(/\s+/g, "");
  if (t.length < 8) return true;
  if (c.includes(t.slice(0, Math.min(20, t.length)))) return true;
  const words = title.split(/\s+/).filter((w) => w.length >= 2).slice(0, 6);
  const hits = words.filter((w) => content.includes(w)).length;
  return hits >= Math.min(2, words.length);
}
