import { load, type CheerioAPI } from "cheerio";
import { cleanArticleBody } from "@/lib/news/article-body-clean";
import { applyArticleRegexFilters } from "@/lib/news/article-body-regex";
import { extractArticleBodyFromJsonLd } from "@/lib/news/article-body-jsonld";
import { resolveSiteBodySelectors } from "@/lib/news/article-body-site-rules";
import { decodeHtmlEntities } from "@/lib/news/decode-html-entities";

/** 공통 본문 영역 (사이트 규칙 다음) */
const GENERIC_BODY_SELECTORS = [
  "#articleViewCon",
  "#article-view-content-div",
  "#articleBody",
  "#article-body",
  "#articleContent",
  "#dic_area",
  "article#dic_area",
  ".article-view-content",
  ".article-view-body",
  ".article_body",
  ".article-body",
  "#news_body_area",
  ".news_body",
  ".view_con",
  ".view_contents",
  ".article_view",
  '[itemprop="articleBody"]',
  ".fck_detail",
  "article.fck_detail",
  "#articeBody",
  ".story-news",
  "#textBody",
  ".article-text",
  "#content-detail",
  ".detail-body",
  "#news_content",
  ".news-content",
  ".article-content",
  ".post-content",
  "article.article",
  "article",
] as const;

const NOISE_SELECTORS =
  "script, style, nav, aside, iframe, svg, video, figure, figcaption, .related, .relation, .tag_group, .journalist, .byline, .article-more, .article-social, .article_share, .banner, .ad-area";

function elementToPlainText($: CheerioAPI, selector: string): string {
  const el = $(selector).first();
  if (!el.length) return "";
  const clone = el.clone();
  clone.find(NOISE_SELECTORS).remove();
  clone.find("br").replaceWith("\n");
  clone.find("p, div, li, h2, h3, blockquote").each((_, node) => {
    const part = $(node).text().trim();
    if (part) $(node).replaceWith(`${part}\n\n`);
  });
  return decodeHtmlEntities(clone.text())
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function trySelectors($: CheerioAPI, selectors: readonly string[]): string {
  let best = "";
  for (const selector of selectors) {
    const el = $(selector).first();
    if (!el.length) continue;
    const text = cleanArticleBody(
      applyArticleRegexFilters(elementToPlainText($, selector))
    );
    if (text.length > best.length) best = text;
  }
  return best;
}

/**
 * cheerio + JSON-LD로 HTML 본문 추출
 * 1) 사이트별 셀렉터  2) 공통 셀렉터  3) JSON-LD articleBody
 */
export function extractTextWithCheerio(html: string, pageUrl?: string): string {
  const $ = load(html);

  const siteSelectors = pageUrl ? resolveSiteBodySelectors(pageUrl) : [];
  let best = trySelectors($, siteSelectors);
  if (best.length >= 80) return best;

  best = trySelectors($, GENERIC_BODY_SELECTORS);
  if (best.length >= 80) return best;

  const fromJsonLd = cleanArticleBody(
    applyArticleRegexFilters(extractArticleBodyFromJsonLd(html))
  );
  if (fromJsonLd.length > best.length) best = fromJsonLd;

  return best;
}
