import { cleanArticleBody } from "@/lib/news/article-body-clean";
import { applyArticleRegexFilters } from "@/lib/news/article-body-regex";

/**
 * Mozilla Readability로 HTML에서 본문 추출 (서버 전용 폴백)
 */
export async function extractTextWithReadability(
  html: string,
  pageUrl: string
): Promise<string> {
  try {
    const { Readability } = await import("@mozilla/readability");
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM(html, { url: pageUrl });
    const parsed = new Readability(dom.window.document).parse();
    const text = parsed?.textContent?.trim() ?? "";
    if (!text) return "";
    return cleanArticleBody(applyArticleRegexFilters(text));
  } catch {
    return "";
  }
}
