import { cleanArticleBody } from "@/lib/news/article-body-clean";
import { extractTextWithReadability } from "@/lib/news/article-body-readability";
import { decodeHtmlEntities } from "@/lib/news/decode-html-entities";
import { isHttpOrHttpsUrl } from "@/lib/news/image-url";
import { isNaverScraperAvailable, scrapeArticleFromUrl } from "@/lib/news/naver-scrape";

const USER_AGENT =
  "Mozilla/5.0 (compatible; HokeiNewsBot/1.0; +https://hokei.vn)";
const FETCH_TIMEOUT_MS = 12_000;
const MIN_BODY_LENGTH = 80;

export type ArticleBodyResult = {
  title: string;
  content: string;
  img?: string | null;
  source: "playwright" | "html";
};

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

/** fetch + HTML 파싱 (Playwright 불가 시 폴백) */
async function fetchArticleBodyFromHtml(
  url: string
): Promise<ArticleBodyResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

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

    if (!res.ok) return null;
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

    let extracted = extractFirst(html, bodyPatterns);
    let content = cleanArticleBody(extracted);

    if (content.length < MIN_BODY_LENGTH) {
      const fromReadability = await extractTextWithReadability(html, url);
      if (fromReadability.length > content.length) {
        content = fromReadability;
        extracted = fromReadability;
      }
    }

    if (content.length < MIN_BODY_LENGTH) return null;

    const title = extractTitleFromHtml(html);
    return {
      title,
      content: content.slice(0, 15_000),
      source: "html",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 기사 원문 URL에서 본문만 추출 (검색 API 요약문 사용 안 함)
 * 1) Playwright 2) HTML fetch
 */
export async function fetchArticleBody(
  url: string
): Promise<ArticleBodyResult | null> {
  if (!isHttpOrHttpsUrl(url)) return null;

  if (await isNaverScraperAvailable()) {
    const scraped = await scrapeArticleFromUrl(url);
    const cleaned = cleanArticleBody(scraped?.content ?? "");
    if (cleaned.length >= MIN_BODY_LENGTH) {
      return {
        title: scraped?.title?.trim() ?? "",
        content: cleaned.slice(0, 15_000),
        img: scraped?.img,
        source: "playwright",
      };
    }
  }

  const fromHtml = await fetchArticleBodyFromHtml(url);
  if (fromHtml) return fromHtml;

  return null;
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
  // 제목 핵심 단어 2개 이상 본문에 포함
  const words = title.split(/\s+/).filter((w) => w.length >= 2).slice(0, 6);
  const hits = words.filter((w) => content.includes(w)).length;
  return hits >= Math.min(2, words.length);
}

