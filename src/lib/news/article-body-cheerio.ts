import { load, type CheerioAPI } from "cheerio";
import { cleanArticleBody } from "@/lib/news/article-body-clean";
import { applyArticleRegexFilters } from "@/lib/news/article-body-regex";
import { decodeHtmlEntities } from "@/lib/news/decode-html-entities";

/** 국내·교민 매체 본문 영역 (우선순위 순) */
const BODY_SELECTORS = [
  "#articleViewCon",
  "#article-view-content-div",
  "#articleBody",
  "#dic_area",
  "article#dic_area",
  ".article-view-content",
  ".article_body",
  ".article-body",
  "#news_body_area",
  ".news_body",
  ".view_con",
  ".article_view",
  '[itemprop="articleBody"]',
  ".fck_detail",
  "article.fck_detail",
  "#articeBody",
  "#article-body",
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
  "script, style, nav, aside, iframe, svg, video, figure, figcaption, .related, .relation, .tag_group, .journalist, .byline";

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

/**
 * cheerio로 HTML 본문 추출 (정규식 폴백)
 */
export function extractTextWithCheerio(html: string): string {
  const $ = load(html);
  $(NOISE_SELECTORS).remove();

  let best = "";
  for (const selector of BODY_SELECTORS) {
    const el = $(selector).first();
    if (!el.length) continue;
    const text = cleanArticleBody(
      applyArticleRegexFilters(elementToPlainText($, selector))
    );
    if (text.length > best.length) best = text;
  }

  return best;
}
