/** URL 호스트·경로별 본문 영역 셀렉터 (우선 시도) */

export type ArticleSiteRule = {
  /** hostname 매칭 */
  host?: RegExp;
  /** pathname 매칭 (articleView CMS 등) */
  path?: RegExp;
  selectors: readonly string[];
};

export const ARTICLE_SITE_RULES: readonly ArticleSiteRule[] = [
  {
    host: /asiatime\.co\.kr/i,
    selectors: ["#articleContent", ".article_txt_container", ".article_container_layout"],
  },
  {
    host: /dnews\.co\.kr/i,
    selectors: [".view_contents.innerNews", ".view_contents", ".view_container"],
  },
  {
    host: /sedaily\.com/i,
    selectors: [
      "section.article-area .view",
      "#article-body",
      '[itemprop="articleBody"]',
    ],
  },
  {
    host: /insidevina\.com/i,
    selectors: [
      "#articleViewCon",
      "#article-view-content-div",
      ".article-view-content",
      "#article-view .article-body",
    ],
  },
  {
    host: /vietnam\.vn/i,
    selectors: [".article-content", ".entry-content", "article .content"],
  },
  {
    host: /ko\.laodong\.vn/i,
    selectors: [".article-content", ".article-detail", "article .content"],
  },
  {
    host: /(?:^|\.)vnexpress\.net$/i,
    selectors: [
      ".fck_detail",
      "article.fck_detail",
      "#article_body",
      ".detail-content",
      '[itemprop="articleBody"]',
    ],
  },
  {
    host: /e\.vnexpress\.net/i,
    selectors: [
      ".fck_detail",
      ".detail-content",
      "article.fck_detail",
      '[itemprop="articleBody"]',
    ],
  },
  {
    host:
      /ebn\.co\.kr|bizwnews\.com|slist\.kr|travie\.com|dongponews\.net|aitimes\.kr|thepowernews\.co\.kr|kyeonggi\.com|ttlnews\.com/i,
    selectors: [
      "#articleViewCon",
      "#article-view-content-div",
      ".article-view-content",
      ".article-body",
      ".article-veiw-body",
    ],
  },
  {
    path: /articleView\.html/i,
    selectors: [
      "#articleViewCon",
      "#article-view-content-div",
      ".article-view-content",
      ".article-body",
    ],
  },
  {
    host: /hyundaimotorgroup\.com/i,
    selectors: [
      ".page-detail__contents",
      ".component-content",
      ".page-detail--news .contents",
    ],
  },
  {
    path: /\/article\/\d+/i,
    selectors: ["#article-body", "#articleContent", ".article-content"],
  },
];

export function resolveSiteBodySelectors(url: string): string[] {
  try {
    const { hostname, pathname } = new URL(url);
    const seen = new Set<string>();
    const out: string[] = [];

    for (const rule of ARTICLE_SITE_RULES) {
      const hostOk = !rule.host || rule.host.test(hostname);
      const pathOk = !rule.path || rule.path.test(pathname);
      if (!hostOk || !pathOk) continue;
      for (const sel of rule.selectors) {
        if (!seen.has(sel)) {
          seen.add(sel);
          out.push(sel);
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}
